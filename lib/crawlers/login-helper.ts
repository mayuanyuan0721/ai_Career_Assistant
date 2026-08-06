/**
 * 招聘网站登录助手
 * 手动登录并保存登录状态
 */

import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

const AUTH_FILE = path.join(process.cwd(), "auth-state.json");

/**
 * 登录 Boss 直聘
 */
async function loginBoss() {
  console.log("🔐 Boss 直聘登录助手\n");
  console.log("即将打开浏览器，请手动登录 Boss 直聘");
  console.log("登录完成后，按回车键继续...\n");

  const browser = await puppeteer.launch({
    headless: false, // 必须显示浏览器，方便手动登录
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled", // 禁用自动化标志
      "--disable-infobars", // 禁用信息栏
      "--window-size=1920,1080", // 设置窗口大小
      "--start-maximized", // 最大化窗口
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  
  // 设置 User-Agent
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  // 隐藏 webdriver 标志
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });
  
  // 设置窗口大小
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 尝试将窗口置顶
  await page.bringToFront();

  // 打开登录页面
  console.log("📍 正在打开登录页面...");
  try {
    await page.goto("https://www.zhipin.com/web/user/?ka=header-login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    console.log("✅ 浏览器已打开，请登录 Boss 直聘");
    console.log("💡 提示：可以使用手机号+验证码登录，或者微信扫码登录");
  } catch (error) {
    console.error("❌ 打开登录页面失败:", error);
    console.log("🔄 请检查网络连接，然后重试");
    await browser.close();
    return;
  }

  // 等待用户登录完成
  console.log("\n⏳ 请在浏览器中完成登录，然后在此处按回车键...");
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });

  // 保存登录状态
  const cookies = await page.cookies();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(cookies, null, 2));
  console.log(`\n✅ 登录状态已保存到 ${AUTH_FILE}`);
  console.log(`📝 共保存 ${cookies.length} 个 cookies`);

  await browser.close();
  console.log("\n🎉 登录完成！现在可以运行爬虫了");
}

/**
 * 登录拉勾网
 */
async function loginLagou() {
  console.log("🔐 拉勾网登录助手\n");
  console.log("即将打开浏览器，请手动登录拉勾网");
  console.log("登录完成后，按回车键继续...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();
  
  // 设置 User-Agent
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  // 隐藏 webdriver 标志
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });
  
  // 设置窗口大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 打开登录页面
  console.log("📍 正在打开登录页面...");
  try {
    await page.goto("https://passport.lagou.com/login/login.html", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    console.log("✅ 浏览器已打开，请登录拉勾网");
  } catch (error) {
    console.error("❌ 打开登录页面失败:", error);
    console.log("🔄 请检查网络连接，然后重试");
    await browser.close();
    return;
  }

  // 等待用户登录完成
  console.log("\n⏳ 请在浏览器中完成登录，然后在此处按回车键...");
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });

  // 保存登录状态
  const cookies = await page.cookies();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(cookies, null, 2));
  console.log(`\n✅ 登录状态已保存到 ${AUTH_FILE}`);
  console.log(`📝 共保存 ${cookies.length} 个 cookies`);

  await browser.close();
  console.log("\n🎉 登录完成！现在可以运行爬虫了");
}

/**
 * 登录猎聘网
 */
async function loginLiepin() {
  console.log("🔐 猎聘网登录助手\n");
  console.log("即将打开浏览器，请手动登录猎聘网");
  console.log("登录完成后，按回车键继续...\n");

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();
  
  // 设置 User-Agent
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  // 隐藏 webdriver 标志
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });
  
  // 设置窗口大小
  await page.setViewport({ width: 1920, height: 1080 });

  // 打开登录页面
  console.log("📍 正在打开登录页面...");
  try {
    await page.goto("https://www.liepin.com/user/login", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    console.log("✅ 浏览器已打开，请登录猎聘网");
  } catch (error) {
    console.error("❌ 打开登录页面失败:", error);
    console.log("🔄 请检查网络连接，然后重试");
    await browser.close();
    return;
  }

  // 等待用户登录完成
  console.log("\n⏳ 请在浏览器中完成登录，然后在此处按回车键...");
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => {
      resolve();
    });
  });

  // 保存登录状态
  const cookies = await page.cookies();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(cookies, null, 2));
  console.log(`\n✅ 登录状态已保存到 ${AUTH_FILE}`);
  console.log(`📝 共保存 ${cookies.length} 个 cookies`);

  await browser.close();
  console.log("\n🎉 登录完成！现在可以运行爬虫了");
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || "boss";

  console.log(`\n🚀 招聘网站登录助手`);
  console.log(`📍 平台: ${platform}\n`);

  switch (platform) {
    case "boss":
      await loginBoss();
      break;
    case "lagou":
      await loginLagou();
      break;
    case "liepin":
      await loginLiepin();
      break;
    default:
      console.error(`❌ 不支持的平台: ${platform}`);
      console.log("支持的 platform: boss, lagou, liepin");
      process.exit(1);
  }
}

main().catch(console.error);
