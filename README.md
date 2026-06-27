<p align="center">
  <img src="banner-01.png" alt="TunnelBridge" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011-0a84ff?style=flat-square&logo=windows&logoColor=white">
  <img src="https://img.shields.io/badge/Electron-React-3b82f6?style=flat-square&logo=electron&logoColor=white">
  <img src="https://img.shields.io/badge/%D8%B2%D8%A8%D8%A7%D9%86-%D9%81%D8%A7%D8%B1%D8%B3%DB%8C%20(RTL)-22c55e?style=flat-square">
  <img src="https://img.shields.io/badge/%D9%82%D8%A7%D8%A8%D9%84%E2%80%8C%D8%AD%D9%85%D9%84-%D8%A8%D8%AF%D9%88%D9%86%20%D9%86%D8%B5%D8%A8-f5b85a?style=flat-square">
  <a href="http://myturbovv.com/"><img src="https://img.shields.io/badge/Built%20for-MyTurboVPN-2563eb?style=flat-square"></a>
</p>

<p align="center"><i>⚡ در اصل برای کاربران <a href="http://myturbovv.com/"><b>MyTurboVPN</b></a> ساخته شده — اما با بیشتر VPNها کار می‌کند.</i></p>

<h1 align="center">TunnelBridge · تونل‌بریج</h1>

<div dir="rtl" align="right">

<h2 align="right">🔗 تونل‌بریج چیست؟</h2>

<p dir="rtl" align="right">
<b>تونل‌بریج</b> یک برنامه‌ی دسکتاپ ویندوز است که اتصال <b>VPN</b> فعال روی کامپیوتر شما را با سایر دستگاه‌هایتان — گوشی، تبلت، لپ‌تاپ — روی همان شبکه‌ی Wi-Fi به اشتراک می‌گذارد. کافی است VPN روی کامپیوتر روشن باشد؛ تونل‌بریج همان اتصال امن را به گوشی شما می‌رساند، همراه با یک داشبورد زنده برای دیدن این‌که چه کسی متصل است و چقدر مصرف می‌کند.
</p>

<h2 align="right">🤔 چرا تونل‌بریج؟</h2>

<p dir="rtl" align="right">
بسیاری از VPNها (برای نمونه <a href="http://myturbovv.com/"><b>MyTurboVPN</b></a> با پروتکل ShadowsocksR) یک پروکسی محلی فقط روی <code>127.0.0.1</code> باز می‌کنند و اجازه نمی‌دهند هیچ دستگاه دیگری به آن وصل شود. تونل‌بریج این محدودیت را برطرف می‌کند: روی پورت شبکه گوش می‌دهد، اتصال گوشی شما را می‌پذیرد و آن را از طریق <code>localhost</code> به پروکسی VPN منتقل می‌کند — درست انگار که خودِ کامپیوتر درخواست داده است. به این ترتیب گوشی شما هم از همان اینترنت آزاد استفاده می‌کند.
</p>

<h2 align="right">✨ ویژگی‌ها</h2>

<ul dir="rtl" align="right">
  <li>📡 <b>اشتراک اتصال VPN</b> با گوشی و دستگاه‌های دیگر، بدون نیاز به کارت وای‌فای یا تنظیمات پیچیده</li>
  <li>📊 <b>داشبورد زنده:</b> سرعت آپلود/دانلود لحظه‌ای، نمودار پهنای باند ۶۰ ثانیه‌ی اخیر، و مصرف کل</li>
  <li>📱 <b>مدیریت دستگاه‌ها:</b> نام‌گذاری دلخواه، مشاهده‌ی مصرف و سرعت هر دستگاه، و <b>مسدود کردن</b> فوری</li>
  <li>🌎 <b>نمایش موقعیت خروج VPN</b> (کشور و شهر سرور)</li>
  <li>🔍 <b>تشخیص خودکار پورت پروکسی</b> — با هر VPNی کار می‌کند: MyTurboVPN، V2Ray، Clash، Shadowsocks و …</li>
  <li>🎨 <b>کاملاً فارسی و راست‌به‌چپ</b>، با تم تیره‌ی مشکی-سفید و رنگ آبی</li>
  <li>📦 <b>قابل‌حمل و بدون نصب</b> — یک فایل اجرایی؛ Python یا چیز دیگری لازم نیست</li>
  <li>🔒 <b>حریم خصوصی کامل</b> — همه‌چیز روی دستگاه شما اجرا می‌شود و هیچ داده‌ای بیرون نمی‌رود</li>
</ul>

<h2 align="right">🖥️ نمایی از برنامه</h2>

</div>

<p align="center">
  <img src="app-screenshot.png" alt="نمای برنامه‌ی تونل‌بریج" width="85%">
</p>

<div dir="rtl" align="right">

<h2 align="right">⚙️ چطور کار می‌کند؟</h2>

</div>

<p align="center">
  <img src="banner-02.png" alt="نحوه‌ی کار تونل‌بریج" width="100%">
</p>

<div dir="rtl" align="right">

<ol dir="rtl" align="right">
  <li>VPN خود (برای نمونه <a href="http://myturbovv.com/">MyTurboVPN</a>) را روی کامپیوتر روشن و متصل کنید.</li>
  <li><code>TunnelBridge.exe</code> را اجرا کنید و روی پیام ویندوز <b>«بله / Yes»</b> بزنید (برای باز کردن خودکار فایروال).</li>
  <li>گوشی را به <b>همان Wi-Fi</b> وصل کنید و در تنظیمات Wi-Fi، پروکسی را روی <b>دستی (Manual)</b> بگذارید و آدرس و پورتی که برنامه نشان می‌دهد را وارد کنید (مثلاً <code>192.168.1.33</code> پورت <code>1081</code>).</li>
  <li>تمام! حالا گوشی شما از همان VPN استفاده می‌کند و می‌توانید مصرف و سرعت را زنده ببینید.</li>
</ol>

<h2 align="right">⬇️ دانلود و نصب</h2>

<p dir="rtl" align="right">
آخرین نسخه‌ی آماده‌ی اجرا را از بخش <b>Releases</b> دریافت کنید:
</p>

</div>

<p align="center">
  <a href="../../releases/latest">
    <img src="https://img.shields.io/badge/⬇️%20%D8%AF%D8%A7%D9%86%D9%84%D9%88%D8%AF%20TunnelBridge.exe-%D9%88%DB%8C%D9%86%D8%AF%D9%88%D8%B2-0a84ff?style=for-the-badge">
  </a>
</p>

<div dir="rtl" align="right">

<p dir="rtl" align="right">
فایل قابل‌حمل است؛ کافی است آن را اجرا کنید — نیازی به نصب نیست.
</p>

<h2 align="right">📲 اتصال دستگاه‌ها — آموزش هر سیستم‌عامل</h2>

<p dir="rtl" align="right">
پس از اجرای تونل‌بریج، آدرس و پورتی که در برنامه نمایش داده می‌شود را بردارید (برای نمونه <code>192.168.1.33</code> و پورت <code>1081</code>). سپس روی هر دستگاهی که به <b>همان Wi-Fi</b> وصل است، طبق راهنمای زیر یک «پروکسی دستی» تنظیم کنید.
</p>

<h3 align="right">🤖 اندروید (Android)</h3>
<ol dir="rtl" align="right">
  <li>به <b>تنظیمات ← Wi-Fi</b> بروید.</li>
  <li>روی نام شبکه‌ی متصل نگه دارید و <b>«تغییر شبکه / Modify network»</b> را بزنید.</li>
  <li><b>«گزینه‌های پیشرفته / Advanced»</b> را باز کنید و <b>Proxy</b> را روی <b>Manual</b> بگذارید.</li>
  <li><b>Proxy hostname</b> = آدرس کامپیوتر (مثلاً <code>192.168.1.33</code>) و <b>Proxy port</b> = <code>1081</code>.</li>
  <li><b>ذخیره</b> کنید. ✅</li>
</ol>

<h3 align="right">🍎 آیفون و آی‌پد (iOS / iPadOS)</h3>
<ol dir="rtl" align="right">
  <li>به <b>Settings ← Wi-Fi</b> بروید و روی <b>(i)</b> کنار شبکه‌ی متصل بزنید.</li>
  <li>پایین صفحه <b>«Configure Proxy»</b> را روی <b>Manual</b> بگذارید.</li>
  <li><b>Server</b> = آدرس کامپیوتر و <b>Port</b> = <code>1081</code>.</li>
  <li>بالا سمت راست <b>Save</b> را بزنید. ✅</li>
</ol>

<h3 align="right">🪟 ویندوز (Windows)</h3>
<ol dir="rtl" align="right">
  <li><b>Settings ← Network &amp; Internet ← Proxy</b> را باز کنید.</li>
  <li>در بخش <b>«Manual proxy setup»</b> گزینه‌ی <b>Use a proxy server</b> را روشن کنید.</li>
  <li><b>Address</b> = آدرس کامپیوتر میزبان و <b>Port</b> = <code>1081</code>.</li>
  <li><b>Save</b> را بزنید. ✅</li>
</ol>

<h3 align="right">🍏 مک (macOS)</h3>
<ol dir="rtl" align="right">
  <li><b>System Settings ← Network ← Wi-Fi ← Details…</b> را باز کنید.</li>
  <li>به تب <b>Proxies</b> بروید.</li>
  <li>تیک <b>«Web Proxy (HTTP)»</b> و <b>«Secure Web Proxy (HTTPS)»</b> را بزنید و برای هرکدام <b>Server</b> = آدرس کامپیوتر و <b>Port</b> = <code>1081</code> را وارد کنید. (می‌توانید <b>SOCKS Proxy</b> را هم با همین مقادیر فعال کنید.)</li>
  <li><b>OK</b> و سپس <b>Apply</b> را بزنید. ✅</li>
</ol>

<h3 align="right">🐧 لینوکس (Linux)</h3>
<p dir="rtl" align="right">
روش گرافیکی (گنوم): <b>Settings ← Network ← Network Proxy ← Manual</b> و وارد کردن آدرس کامپیوتر و پورت <code>1081</code> برای HTTP، HTTPS و SOCKS. یا از طریق ترمینال:
</p>

</div>

```bash
export http_proxy="http://192.168.1.33:1081"
export https_proxy="http://192.168.1.33:1081"
export all_proxy="socks5://192.168.1.33:1081"
```

<div dir="rtl" align="right">

<p dir="rtl" align="right">
برای برنامه‌های خط‌فرمان هم می‌توانید از <code>proxychains</code> با <code>socks5 192.168.1.33 1081</code> استفاده کنید.
</p>

<blockquote dir="rtl" align="right">💡 <code>192.168.1.33</code> فقط یک نمونه است — آدرس واقعی را از خودِ برنامه‌ی تونل‌بریج بخوانید.</blockquote>

<h2 align="right">🔧 پشتیبانی از سایر VPNها (تنظیمات)</h2>

<p dir="rtl" align="right">
تونل‌بریج هنگام اجرا به‌صورت خودکار پورت پروکسی VPN شما را پیدا می‌کند. اگر از VPN دیگری استفاده می‌کنید یا پورت به‌صورت خودکار پیدا نشد، روی آیکن <b>⚙ تنظیمات</b> در نوار بالای برنامه بزنید و:
</p>

<ul dir="rtl" align="right">
  <li>دکمه‌ی <b>«تشخیص خودکار»</b> را بزنید تا پورت پروکسی شناسایی شود، یا</li>
  <li>پورت پروکسی، آدرس سرور و پورت اشتراک را دستی وارد کنید.</li>
</ul>

<h2 align="right">🛠️ ساخت از روی سورس</h2>

<p dir="rtl" align="right">
برای ساختن نسخه‌ی اجرایی از روی کد (نیازمند <b>Node.js</b>):
</p>

</div>

```bash
cd desktop
npm install            # نصب وابستگی‌ها
npm run dist           # خروجی: desktop/release/TunnelBridge.exe
```

<div dir="rtl" align="right">

<p dir="rtl" align="right">برای اجرای حالت توسعه:</p>

</div>

```bash
cd desktop
npm run build:vite     # ساخت رابط کاربری (React)
npm start              # اجرای برنامه
```

<div dir="rtl" align="right">

<h2 align="right">🧩 ساختار پروژه</h2>

<ul dir="rtl" align="right">
  <li><code>desktop/electron/</code> — پردازه‌ی اصلی Electron: موتور رله (Node)، تشخیص پروکسی، فایروال و IPC</li>
  <li><code>desktop/src/</code> — رابط کاربری React (داشبورد فارسی/RTL)</li>
  <li><code>desktop/build/</code> — آیکن برنامه</li>
  <li><code>IRANSansWeb.ttf</code> — فونت داخلی برنامه</li>
</ul>

<h2 align="right">💙 ساخته‌شده برای MyTurboVPN</h2>

<p dir="rtl" align="right">
تونل‌بریج در اصل برای کاربران <a href="http://myturbovv.com/"><b>MyTurboVPN</b></a> ساخته شده است — یک سرویس VPN سریع و پایدار که دسترسی آزاد و امن به اینترنت را برای کاربران فراهم می‌کند. با تونل‌بریج می‌توانید همان اشتراک MyTurboVPN را روی <b>همه‌ی</b> دستگاه‌هایتان داشته باشید. اگر هنوز VPN ندارید، MyTurboVPN انتخابی عالی است و تونل‌بریج به‌طور کامل با آن هماهنگ است. 🚀
</p>

</div>

<p align="center">
  <a href="http://myturbovv.com/"><img src="https://img.shields.io/badge/🌐%20myturbovv.com-%D9%85%D8%B4%D8%A7%D9%87%D8%AF%D9%87-2563eb?style=for-the-badge"></a>
</p>

<div dir="rtl" align="right">

<h2 align="right">🔒 حریم خصوصی</h2>

<p dir="rtl" align="right">
تونل‌بریج صرفاً یک پل محلی است. هیچ آمار یا داده‌ای جمع‌آوری یا ارسال نمی‌کند؛ تمام پایش و اطلاعات فقط روی همان کامپیوتر شما باقی می‌ماند.
</p>

<h2 align="right">📝 مجوز</h2>

<p dir="rtl" align="right">
این پروژه آزاد است و می‌توانید آزادانه از آن استفاده کنید و آن را با دوستانتان به اشتراک بگذارید. 💙
</p>

</div>

<p align="center"><sub>Made with 💙 for free and open internet · ساخته‌شده برای اینترنت آزاد</sub></p>
