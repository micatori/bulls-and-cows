import { el } from './ui/dom.ts';
import { mountApp } from './ui/app.ts';

const root = el('div', { className: 'app' });

document.body.append(root);

mountApp(root);
