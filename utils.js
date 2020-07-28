export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

export function create(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);
  Object.assign(element, attributes);
  if (attributes.class) {
    element.classList.add(...attributes.class.split(' '));
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

