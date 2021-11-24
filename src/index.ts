import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";
import { createObjectCsvWriter } from "csv-writer";

function promiseAwait(millis: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, millis);
  });
}

const copyFile = "images/hello.png";
const searchFor = "you+s01+2021";
const allTexts: { text: string; link: string }[] = [];

async function writeCsv(data: { text: string; link: string }[]) {
  const writer = createObjectCsvWriter({
    path: "parsed/out.csv",
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

  await writer.writeRecords(data);
}

async function main() {
  const browser = await puppeteer.launch({ headless: false });

  const selector = "tr:nth-child(2) img";

  const page = await browser.newPage();
  await page.goto("https://rarbggo.org/torrents.php");

  await page.waitForSelector(selector);

  // await promiseAwait(10 * 1000);

  // const src = await page.evaluate(
  //   () => document.querySelectorAll("img")[1].src
  // );

  await promiseAwait(1000);

  const image = await page.$(selector);
  if (!image) {
    console.log("Could not find image");
    return;
  }

  const boundingBox = await image.boundingBox();
  if (!boundingBox) {
    console.error("No bounding box");
    return;
  }
  const screenshot = await page.screenshot({
    path: copyFile,
    clip: boundingBox,
  });

  // Parse text in image

  const { data } = await Tesseract.recognize(copyFile);
  const text = data.text.trim();
  console.log(text);

  await page.focus("#solve_string");
  await page.keyboard.type(text + "\n");

  await promiseAwait(3000);

  for (let i = 1; i < 200; i++) {
    await page.goto(
      `https://rarbggo.org/torrents.php?search=${searchFor}&page=${i}`
    );

    const texts = await page.evaluate(() => {
      return [
        ...document.querySelectorAll(
          ".lista2t tr.lista2 > td:nth-child(2) > a:nth-child(1)"
        ),
      ].map((el) => {
        if (el instanceof HTMLAnchorElement)
          return {
            text: el.innerText,
            link: el.href,
          };

        throw new Error("yes");
      });
    });

    if (texts.length === 0) {
      break;
    }

    allTexts.push(...texts);

    // const data = await page.$eval(
    //   ".lista2t tr.lista2 > td:nth-child(2) > a:nth-child(1)",
    //   (el) => {
    //     if (el instanceof HTMLAnchorElement)
    //       return {
    //         text: el.innerText,
    //         link: el.href,
    //       };
    //   }
    // );

    console.log(texts);
  }

  console.log(allTexts);

  writeCsv(allTexts);

  // await browser.close();
}

main();
