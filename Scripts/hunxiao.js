// 小白专属JS混淆脚本 - 自动备份+一键混淆
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// ====================== 你只需要改这里 ======================
const TARGET_FILE = './cc.js'; // 替换成你的JS文件路径（比如 ./index.js）
// ===========================================================

// 自动生成备份文件和混淆文件的名称
const BACKUP_FILE = TARGET_FILE.replace('.js', '-y.js');
const OBFUSCATE_FILE = TARGET_FILE.replace('.js', '-j.js');

// 混淆配置（小白不用改，兼顾安全性和运行稳定性）
const obfuscateOptions = {
  compact: true, // 压缩代码体积
  selfDefending: true, // 防止简单反混淆
  stringArray: true, // 加密所有字符串
  stringArrayEncoding: ['base64'],  // 字符串加密方式
  controlFlowFlattening: true, // 打乱代码执行逻辑
  controlFlowFlatteningThreshold: 0.8, // 打乱程度（太高会影响性能）
  deadCodeInjection: false, // 关闭无用代码注入（避免代码体积过大）
  renameGlobals: false, // 不重命名全局变量（避免调用出错）
  renameProperties: false, // 不重命名对象属性（避免业务逻辑出错）
  transformObjectKeys: false // 不转换对象键名
};

// 核心执行逻辑
async function startObfuscate() {
  try {
    // 1. 检查目标文件是否存在
    if (!fs.existsSync(TARGET_FILE)) {
      console.error(`❌ 错误：找不到文件 ${TARGET_FILE}，请检查文件路径是否正确！`);
      return;
    }

    // 2. 自动备份原始代码（避免覆盖）
    if (!fs.existsSync(BACKUP_FILE)) {
      fs.copyFileSync(TARGET_FILE, BACKUP_FILE);
      console.log(`✅ 已自动备份原始代码到：${BACKUP_FILE}`);
    } else {
      console.log(`ℹ️ 原始代码备份已存在，跳过备份步骤`);
    }

    // 3. 读取要混淆的代码
    const originalCode = fs.readFileSync(TARGET_FILE, 'utf8');
    console.log(`ℹ️ 正在混淆代码...`);

    // 4. 执行混淆
    const obfuscatedResult = JavaScriptObfuscator.obfuscate(originalCode, obfuscateOptions);
    const obfuscatedCode = obfuscatedResult.getObfuscatedCode();

    // 5. 写入混淆后的代码
    fs.writeFileSync(OBFUSCATE_FILE, obfuscatedCode, 'utf8');
    console.log(`✅ 混淆完成！混淆后的文件：${OBFUSCATE_FILE}`);
    console.log(`\n💡 提示：`);
    console.log(`   - 原始代码：${BACKUP_FILE}（自己保留，别弄丢！）`);
    console.log(`   - 混淆代码：${OBFUSCATE_FILE}（可以发给别人/上线使用）`);

  } catch (error) {
    console.error(`❌ 混淆失败：${error.message}`);
  }
}

// 启动脚本
startObfuscate();