export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

export function create(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);

  const specialProps = ['class', 'style'];
  Object.assign(element, _.omit(attributes, specialProps));

  if (attributes.class) {
    element.classList.add(...attributes.class.split(' '));
  }

  if (attributes.style) {
    if (typeof attributes.style === 'object') {
      Object.assign(element.style, attributes.style);
    } else {
      element.style = attributes.style;
    }
  }

  element.append(...children);
  return element;
}

export function enableAutoResize(input) {
  function updateSize() {
    requestAnimationFrame(() => {
      input.size = (input.value.length || input.placeholder.length || 1);
    });
  }

  for (let eventName of ['keyup', 'keypress', 'focus', 'blur', 'change']) {
    input.addEventListener(eventName, updateSize, false);
    input.classList.add('variable-length');
  }

  updateSize();
}

/**
 * Taken from and modified using:
 * https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
 */
export function copyTextToClipboard(text) {
  const textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  Object.assign(textArea.style, {
    // Place in top-left corner of screen regardless of scroll position.
    position: 'fixed',
    top: 0,
    left: 0,

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    width: '2em',
    height: '2em',

    // We don't need padding, reducing the size if it does flash render.
    padding: 0,

    // Clean up any borders.
    border: 'none',
    outline: 'none',
    boxShadow: 'none',

    // Avoid flash of white box if rendered for any reason.
    background: 'transparent'
  });

  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  let supported;
  try {
    supported = document.queryCommandSupported('copy');
  } catch (err) {
    lively.warn('Copy to clipboard not supported.', err);
    supported = false;
  }
  if (supported) {
    let enabled;
    try {
      enabled = document.queryCommandEnabled('copy');
    } catch (err) {
      lively.warn('Copy to clipboard not enabled.', err);
      enabled = false;
    }
    if (enabled) {
      try {
        if (!document.execCommand('copy')) {
          lively.warn('Copying not successful.');
        }
      } catch (err) {
        lively.warn('Unable to execute copy.');
      }
    }
  }

  document.body.removeChild(textArea);
}
