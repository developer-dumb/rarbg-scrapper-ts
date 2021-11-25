import { createObjectCsvWriter, createObjectCsvStringifier } from "csv-writer";
import commandLineArgs from "command-line-args";
import { extractPuppeteer } from "./puppeteerExtractor";

function parseCsvData(data: { text: string; link: string }[]) {
  const writer = createObjectCsvStringifier({
    header: [
      {
        id: "text",
        title: "Text",
      },
      {
        id: "link",
        title: "Link",
      },
    ],
  });

  return writer.stringifyRecords(data);
}

async function main() {
  const options = commandLineArgs([
    {
      name: "search",
      alias: "s",
      defaultOption: true,
    },
    {
      name: "fileOutput",
      alias: "f",
      type: String,
    },
    {
      name: "headless",
      alias: "h",
      type: Boolean,
      defaultValue: false,
    },
    {
      name: "verbose",
      alias: "v",
      type: Boolean,
      defaultValue: false,
    },
  ]);

  if (!options.search) {
    throw new Error(
      'Please use "-s <string_to_search>" or "--search <string_to_search>" to seach for a string.'
    );
  }

  const texts = await extractPuppeteer({
    closeBrowser: true,
    searchString: options.search,
    screenShotLocation: "images/test.png",
  });

  if (!texts) return;

  const data = parseCsvData(texts);

  process.stdout.write(data);
}

main();
