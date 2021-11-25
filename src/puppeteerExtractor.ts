import puppeteer from "puppeteer";
import Tesseract from "tesseract.js";
import { promiseAwait } from "./utils";

/**
 * Opens a browser tab and scraps rarbg.to
 *
 * @param screenShotLocation
 * @param searchString
 * @param closeBrowser
 */
export async function extractPuppeteer({
  screenShotLocation,
  searchString,
  closeBrowser,
}: {
  screenShotLocation: string;
  searchString: string;
  closeBrowser: boolean;
}) {
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
    path: screenShotLocation,
    clip: boundingBox,
  });

  // Parse text in image

  const { data } = await Tesseract.recognize(screenShotLocation);
  const text = data.text.trim();
  // console.log(text);

  await page.focus("#solve_string");
  await page.keyboard.type(text + "\n");

  await promiseAwait(3000);

  const allTexts: { text: string; link: string }[] = [];

  for (let i = 1; i < 200; i++) {
    await page.goto(
      `https://rarbggo.org/torrents.php?search=${searchString}&page=${i}`
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
  }

  // console.log(allTexts);

  if (closeBrowser) {
    await browser.close();
  }

  return allTexts;
}
