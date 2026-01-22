import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import GlobalAblyProvider from './components/GlobalAblyProvider';
import GlobalLoader from './components/GlobalLoader';
import i18n from './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Quizz';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')).then((module: any) => {
            const page = module.default;
            const originalLayout = page.layout;
            page.layout = (pageNode: any) => {
                const content = originalLayout ? originalLayout(pageNode) : pageNode;
                return <GlobalAblyProvider>{content}</GlobalAblyProvider>;
            };
            return module;
        }),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <I18nextProvider i18n={i18n}>
                <GlobalLoader />
                <App {...props} />
            </I18nextProvider>,
        );
    },
    progress: false, // Customized in GlobalLoader
});
