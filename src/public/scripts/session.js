// import { onCleanup, createSignal } from "https://esm.sh/solid-js@1.8.1";
import { render } from "https://esm.sh/solid-js@1.8.1/web";
import {
  createWS,
  createWSState,
} from "https://esm.sh/@solid-primitives/websocket@1.3.0";
import html from "https://esm.sh/solid-js@1.8.1/html";

/**
 * js doc typedef for tuple with two elements
 * @typedef {[string, number]} Button
 * @type {Button[]}
 */
const buttons = [
  ["1", 1],
  ["2", 2],
  ["4", 4],
];

/**
 * @type {string}
 */
const channelID = location.pathname.split("/").pop();

// https://primitives.solidjs.community/package/websocket/
/**
 * @type {string}
 */
const websocketUrl = `ws://${location.host}/ws/${channelID}`;

/**
 * @param {function(int):void} onClick
 *
 * @returns {JSX.Element} The rendered Buttons component.
 */
const Buttons = ({ onClick }) => {
  return html`<div>
    ${buttons.map(
      ([text, value]) =>
        html`<button onclick=${() => onClick(value)}>${text}</button>`
    )}
  </div>`;
};

/**
 * Main application component.
 * @returns {JSX.Element} The rendered App component.
 */
const App = () => {
  const ws = createWS(websocketUrl);
  const state = createWSState(ws);

  const handleClick = (value) => {
    const isConnected = state() === 1;

    if (isConnected) {
      console.log("Sending", value);
      ws.send(value);
    }
  };

  return html`<${Buttons} onClick=${handleClick} />`;
};

render(App, document.body);
