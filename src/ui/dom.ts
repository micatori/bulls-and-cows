export type Tag = keyof HTMLElementTagNameMap;

export type AttributeValue = string | number | boolean;

export interface ElementOptions {
  readonly attrs?: Readonly<Record<string, AttributeValue>>;
  readonly text?: string;
  readonly className?: string;
}

export const el = <K extends Tag>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);

  if (options.className !== undefined) {
    node.className = options.className;
  }

  if (options.attrs !== undefined) {
    Object.entries(options.attrs).forEach(([name, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          node.setAttribute(name, '');
        }
        return;
      }

      node.setAttribute(name, String(value));
    });
  }

  if (options.text !== undefined) {
    node.textContent = options.text;
  }

  node.append(...children);

  return node;
};

export const text = (value: string): Text => document.createTextNode(value);

export const on = <K extends keyof HTMLElementEventMap>(
  node: HTMLElement,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
): void => {
  node.addEventListener(type, handler);
};

export const setEnabled = (
  node: HTMLButtonElement | HTMLInputElement,
  enabled: boolean,
): void => {
  node.disabled = !enabled;
};

export const replaceAll = (
  parent: HTMLElement,
  children: readonly Node[],
): void => {
  parent.replaceChildren(...children);
};
