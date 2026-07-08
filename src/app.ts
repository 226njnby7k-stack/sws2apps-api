import express, { Request } from 'express';
import { handle } from 'i18next-http-middleware';
import favicon from 'serve-favicon';
import helmet from 'helmet';
import path from 'node:path';
import rateLimit from 'express-rate-limit';
import requestIp from 'request-ip';
import compression from 'compression';
import i18next from 'i18next';

import { internetChecker } from './v3/middleware/internet_checker.js';
import { requestChecker } from './v3/middleware/request_checker.js';
import { updateTracker } from './v3/middleware/update_tracker.js';
import { serverReadyChecker } from './v3/middleware/server_ready_checker.js';

import routesV3 from './v3/routes/index.js';

import { errorHandler, getRoot, invalidEndpointHandler } from './v3/controllers/app_controller.js';
import { getHealth } from './v3/controllers/health_controller.js';
import resources from './v3/config/i18n_config.js';

// Origins allowed to make CREDENTIALED cross-origin (CORS) calls. This set is
// intentionally BROADER than auth_controller's APP_ORIGIN_ALLOWLIST (which gates
// where a passwordless sign-in link may point) — it includes the admin consoles,
// which must never receive an emailed login link. Do not merge the two lists.
const whitelist = [
	'https://organized-app.com',
	'https://staging.organized-app.com',
	'https://cpe-web.sws2apps.com',
	'https://console.sws2apps.com',
	'https://dev-console.sws2apps.com',
	'https://dev-console.sws2apps.com',
	'https://cpe-sws.firebaseapp.com',
];

const allowedUri = ['/app-version', '/api/public/source-material'];

// Origins allowed to make CREDENTIALED cross-origin calls. Reflecting an
// arbitrary Origin together with Allow-Credentials:true lets any site drive the
// API with the victim's cookie — so gate it to known app origins (+ APP_ORIGIN,
// + localhost in dev).
const isAllowedOrigin = (origin?: string): boolean => {
	if (!origin) return false;
	if (whitelist.includes(origin)) return true;
	if (process.env.APP_ORIGIN && origin === process.env.APP_ORIGIN) return true;
	if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
	return false;
};

// True for the handful of endpoints that are meant to be readable cross-origin
// by anyone (no cookie needed). These get ACAO:* WITHOUT credentials.
const isPublicUri = (req: Request): boolean => {
	const uri = (req.headers['x-original-uri'] as string) || req.path;
	return allowedUri.some((allowed) => uri.startsWith(allowed));
};

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(express.static('public'));

const __dirname = path.resolve();

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check — mounted BEFORE the CORS / requestChecker / serverReadyChecker /
// rate-limit middleware so the internal, header-less Compose probe reaches it and
// it can report storage health even during startup. Not browser-facing.
app.get('/health', getHealth);

// Single authoritative CORS handler. This replaces the previous `cors()`
// middleware, which short-circuited OPTIONS preflight and — in non-production —
// reflected ANY Origin together with Allow-Credentials:true (a credentialed
// cross-origin hole). Rules:
//   1. Allowlisted origin  -> echo Origin + Allow-Credentials:true.
//   2. Public endpoint     -> ACAO:* WITHOUT credentials (read-only, no cookie).
//   3. Otherwise           -> no ACAO at all (browser blocks the response).
app.use((req, res, next) => {
	const origin = req.headers.origin;

	res.header('Vary', 'Origin');

	if (origin && isAllowedOrigin(origin)) {
		res.header('Access-Control-Allow-Origin', origin);
		res.header('Access-Control-Allow-Credentials', 'true');
	} else if (isPublicUri(req)) {
		res.header('Access-Control-Allow-Origin', '*');
	}

	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS');
	// Reflect the client's requested headers (matches the behaviour of the cors()
	// package this replaced). The client sends custom headers — appclient,
	// appversion, language, metadata — beyond Content-Type/Authorization; a
	// credentialed request (Allow-Credentials:true) requires every one of them to
	// be listed here explicitly (the '*' wildcard is invalid with credentials), or
	// the browser blocks the request at preflight.
	res.header(
		'Access-Control-Allow-Headers',
		req.headers['access-control-request-headers'] || 'Content-Type, Authorization, appclient, appversion, language, metadata'
	);
	res.header('Access-Control-Max-Age', '86400');

	if (req.method === 'OPTIONS') {
		res.sendStatus(204);
		return;
	}

	next();
});

app.use(requestIp.mw()); // get IP address middleware
app.use(internetChecker());
app.use(requestChecker());
app.use(updateTracker());
app.use(serverReadyChecker());

app.use(rateLimit({ windowMs: 1000, max: 20, message: JSON.stringify({ message: 'TOO_MANY_REQUESTS' }) }));

i18next.init({
	preload: ['eng'],
	lng: 'eng',
	fallbackLng: 'eng',
	resources: resources,
});

app.use(handle(i18next));

app.get('/', getRoot);

// load routes
app.use('/api/v3', routesV3);

// Handling invalid routes
app.use(invalidEndpointHandler);

// Handling error for all requests
app.use(errorHandler);

export default app;
