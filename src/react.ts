import { render as renderCommon, RenderOptions } from './render';
import { bootstrap as bootstrapCommon, Importer } from './bootstrap';
import { state } from './state';
import { isInNode } from './is-in-node';
import { configureCreateOverride } from 'react-override';

export { Override } from 'react-override';

export const createOverride = configureCreateOverride(isInNode ? false : true);

export async function render(
  elementToRender: JSX.Element | ((app: JSX.Element) => JSX.Element) = state
    .browserState?.renderElement.value,
  options: RenderOptions = {}
) {
  if (!isInNode && typeof elementToRender === 'function') {
    const rendered = elementToRender(
      state.browserState?.renderElement.value ?? ({} as any)
    );
    elementToRender = rendered;
  }

  return renderCommon(
    { __isRenderable: true, thing: elementToRender },
    options,
    async (e, c) => {
      const rendered = state.browserState!.renderFn!(e.thing, c as any);
      await new Promise((r) => setTimeout(r, 0));
      return rendered;
    }
  );
}

type BootstrapArgs = Importer & {
  element: JSX.Element;
  container: HTMLElement | null;
  render: (e: JSX.Element, c: HTMLElement) => void;
};

export const bootstrap = async (args: BootstrapArgs): Promise<void> => {
  state.browserState = {
    retryAttempt: 0,
    renderElement: { __type: 'renderElement', value: args.element },
    renderContainer: { __type: 'renderContainer', value: args.container },
    renderFn: args.render,
  };

  return bootstrapCommon({
    ...args,
    defaultRender: () =>
      state.browserState?.renderFn!(args.element, args.container!),
  });
};
