import { html } from "hono/html";
import { type HtmlEscapedString } from "hono/utils/html";

type DefaultTemplateArgs = {
  title: string;
  content: HtmlEscapedString | Promise<HtmlEscapedString>;
};

export const defaultTemplate = ({ content, title }: DefaultTemplateArgs) => {
  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} | Good Pointing Poker</title>
      </head>
      <body>
        <header>
          <h1>Good Pointing Poker</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
            </ul>
          </nav>
        </header>

        <main>${content}</main>
      </body>
    </html>`;
};
