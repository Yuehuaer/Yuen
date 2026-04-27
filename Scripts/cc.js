/*
 * @Author: Yuehuaer
 * @Description: (MyMoney)
 * @Version: 13.2.43
 * 使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
 *******************************
 [rewrite_local]
 ^https:\/\/userapi\.feidee\.net\/v1\/profile\/basic_info url script-response-body https://raw.githubusercontent.com/Yuehuaer/Yuen/refs/heads/main/Scripts/cc.js
 
 [mitm]
 hostname = userapi.feidee.net
 *
 */

let body = $response.body;

try {
  let obj = JSON.parse(body);
  
  // 核心逻辑 1：将会员状态由 false 改为 true
  if (obj.is_vip !== undefined) {
    obj.is_vip = true;
  }
  
  // 核心逻辑 2：测试小技巧 - 给昵称加个后缀
  // 这样只要打开App看到昵称变了，就知道脚本 100% 匹配并执行成功了
  if (obj.nickname) {
    obj.nickname = obj.nickname + " (VIP版)";
  }

  // 将修改后的 JSON 对象重新转回字符串并返回给 App
  $done({ body: JSON.stringify(obj) });
  
} catch (e) {
  // 容错处理：如果解析出错，直接返回原数据，防止App断网报错
  console.log("JSON解析失败: " + e);
  $done({ body });
}