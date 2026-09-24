# Planet Animal Hospital

React and Vite app for pet parents and the clinic care team. The production site is [planet-animal-hospital-app.vercel.app](https://planet-animal-hospital-app.vercel.app/).

## Local development

Install dependencies with `npm ci`. Start the development server with `npm run dev`. The visual preview is at `/preview?path=/&demo_mode=true&device=samsung-s26-ultra`; it uses demo content and cannot read or change a live wallet. Run `npm run lint`, `npm run test:care`, and `npm run build` before release. The Firestore/Auth emulator test is `npm run test:emulator` and requires a local Java runtime.

## Clinic activation

The browser uses the public Firebase configuration in `firebase-applet-config.json`. Private care, wallet, prescription, and AI operations require clinic-controlled **server-only** settings. See [.env.example](.env.example), [approved care workflow](docs/approved-care-pilot.md), and [clinical AI integration](docs/clinical-ai-integration.md) for the contracts.

1. Configure Firebase Admin for the same project and Firestore database as the browser app using `CARE_FIREBASE_PROJECT_ID`, `CARE_FIRESTORE_DATABASE_ID`, and a clinic-controlled `CARE_FIREBASE_SERVICE_ACCOUNT_JSON` or approved application credentials. Deploy the reviewed Firestore rules and indexes to that database.
2. Enrol clinic staff with verified `clinicId: planet-animal` and appropriate `clinicRole` claims. A real veterinarian must review and approve clinical care; a manager must approve reward rules. No balance, discount, or appointment is inferred from a parent request.
3. To enable administrative AI chat, the clinic must choose a supported model, provide `CARE_ASSISTANT_API_KEY` and `CARE_ASSISTANT_MODEL`, and set `CARE_ASSISTANT_DATA_APPROVED=true` only after approving the provider and data use. The server enforces five requests per UTC day and twenty per UTC month per account.
4. Tiered clinical AI drafts are a separate, veterinarian-reviewed service. They require the clinic-approved `CARE_CLINICAL_*` settings described in the clinical integration document. Without them, recorded care remains available and AI drafting fails closed.
5. Use an authorized clinic test parent and veterinarian account to verify sign-in, account isolation, care approval, wallet ledger, quotas, and provider responses in production. Never put provider keys in `VITE_` variables or ask parents to enter keys.

The Book Visit flow prepares a WhatsApp request for the parent to review and send. The clinic confirms the appointment separately. A booking request alone does not award Paw Points.
