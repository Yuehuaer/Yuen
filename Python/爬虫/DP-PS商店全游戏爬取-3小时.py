import json
import time
import os
import re
import random
from datetime import datetime
from drissionpage import ChromiumPage, ChromiumOptions
from drissionpage import errors as Errors

# ================= 防封核心配置 =================
JSON_FILENAME = 'ps_store_monitor.json'
MAX_PAGES_LIMIT = 372         # 目标爬取页数
HEADLESS_MODE = True         # 【重要】非必要不要开无头！无头更容易被封
# 随机延迟（模拟真人操作）
SCROLL_INTERVAL_MIN = 0.8     # 滚动后最小等待时间（秒）
SCROLL_INTERVAL_MAX = 1.5     # 滚动后最大等待时间
PAGE_DELAY_MIN = 3            # 页间最小等待时间（秒）
PAGE_DELAY_MAX = 7            # 页间最大等待时间
ITEM_DELAY_MIN = 0.1          # 商品解析最小间隔（秒）
ITEM_DELAY_MAX = 0.3          # 商品解析最大间隔
RETRY_TIMES = 3               # 页面加载重试次数
RETRY_DELAY = 5               # 重试间隔（秒）
# 浏览器伪装配置
USER_AGENT_LIST = [           # 随机User-Agent，避免单一特征
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Edge/118.0.2088.76"
]
# ================================================

def load_existing_data() -> dict:
    """加载历史监控数据"""
    if not os.path.exists(JSON_FILENAME):
        print(f"📂 首次执行，创建新数据库：{JSON_FILENAME}")
        return {}
    
    try:
        with open(JSON_FILENAME, 'r', encoding='utf-8') as f:
            data_list = json.load(f)
            db = {str(item['id']): item for item in data_list}
            print(f"📂 数据库加载完成，共有 {len(db)} 条记录")
            return db
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"⚠️  数据库读取失败（{e}），将创建新数据库")
        return {}

def save_data_to_json(db: dict) -> None:
    """保存数据（每10页临时保存一次，防止崩溃丢数据）"""
    try:
        with open(JSON_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(list(db.values()), f, ensure_ascii=False, indent=4)
        print(f"💾 数据已临时保存至 {JSON_FILENAME}")
    except Exception as e:
        print(f"❌ 保存数据失败：{e}")

def extract_product_info(item) -> tuple | None:
    """提取商品信息（带随机延迟）"""
    try:
        # 模拟真人浏览：随机微小延迟
        time.sleep(random.uniform(ITEM_DELAY_MIN, ITEM_DELAY_MAX))
        
        # 提取商品ID
        link_ele = item.ele('css:a.psw-link', timeout=0)
        if not link_ele:
            return None
        href = link_ele.attr('href')
        pid_match = re.search(r'/concept/(\d+)', href)
        if not pid_match:
            return None
        pid = pid_match.group(1)

        # 模拟真人：随机悬停（降低机器特征）
        try:
            item.hover()
            time.sleep(random.uniform(0.1, 0.2))
        except:
            pass

        # 提取商品名称
        name_ele = item.ele('css:#product-name', timeout=0)
        name = name_ele.text.strip() if name_ele else "未知名称"

        # 提取价格
        price_ele = item.ele('css:span[data-qa*="price#display-price"]', timeout=0)
        curr_price = price_ele.text.strip() if price_ele else "HK$0"

        return (pid, name, curr_price)
    except Exception as e:
        return None

def parse_price_to_num(price_str: str) -> float | None:
    """解析价格为数字"""
    try:
        num_str = re.sub(r'[^\d.]', '', price_str)
        return float(num_str) if num_str else 0.0
    except:
        return None

def simulate_human_behavior(page):
    """模拟真人浏览行为"""
    try:
        # 随机轻微滚动（不是直接滚到底）
        scroll_height = page.scroll.height()
        random_scroll = random.randint(int(scroll_height*0.7), int(scroll_height*0.9))
        page.scroll.to_position(random_scroll)
        time.sleep(random.uniform(0.5, 1.0))
        # 最终滚到底
        page.scroll.to_bottom()
        # 随机等待
        time.sleep(random.uniform(SCROLL_INTERVAL_MIN, SCROLL_INTERVAL_MAX))
    except:
        # 模拟失败不影响主流程
        page.scroll.to_bottom()
        time.sleep(random.uniform(SCROLL_INTERVAL_MIN, SCROLL_INTERVAL_MAX))

def scrape_ps_store():
    """核心爬取逻辑（防封版）"""
    start_time = time.time()
    print(f"🚀 开始监控 PlayStation Store（{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}）")
    print(f"⚠️  防封策略已启用 | 目标页数：{MAX_PAGES_LIMIT} | 页间随机延迟：{PAGE_DELAY_MIN}-{PAGE_DELAY_MAX}秒")

    # 配置浏览器（深度伪装）
    co = ChromiumOptions()
    co.headless(HEADLESS_MODE)
    # 随机User-Agent
    co.set_user_agent(random.choice(USER_AGENT_LIST))
    # 禁用自动化检测
    co.set_argument('--disable-blink-features=AutomationControlled')
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-dev-shm-usage')  # 解决内存不足
    co.set_argument('--disable-gpu')           # 禁用GPU，降低特征
    # 模拟真人浏览器语言/地区
    co.set_argument('--lang=zh-HK,zh;q=0.9,en;q=0.8')
    # 禁用扩展/插件
    co.set_argument('--disable-extensions')
    co.set_argument('--disable-plugins')

    # 初始化浏览器
    try:
        page = ChromiumPage(co)
        # 清除浏览器指纹
        page.run_js('Object.defineProperty(navigator, "webdriver", {get: () => undefined})')
    except Errors.BrowserError as e:
        print(f"❌ 浏览器启动失败：{e}")
        return

    # 加载历史数据
    db = load_existing_data()
    today_online_ids = set()
    discount_count = 0
    new_product_count = 0

    try:
        for page_num in range(1, MAX_PAGES_LIMIT + 1):
            page_start = time.time()
            url = f"https://store.playstation.com/zh-hant-hk/pages/browse/{page_num}"
            print(f"\n───────────────────────────────────────")
            print(f"📄 [进度 {page_num}/{MAX_PAGES_LIMIT}] 正在扫描第 {page_num} 页：{url}")

            # 页面加载（带重试+随机延迟）
            load_success = False
            for retry in range(RETRY_TIMES + 1):
                try:
                    page.get(url, timeout=20)
                    # 检查是否触发人机验证
                    if "人机验证" in page.html or "Cloudflare" in page.html:
                        print(f"⚠️  第 {page_num} 页触发人机验证！请手动完成验证后按回车继续...")
                        input()  # 暂停等待手动验证
                    load_success = True
                    break
                except Errors.PageTimeoutError:
                    print(f"⚠️  第 {page_num} 页加载超时（重试 {retry+1}/{RETRY_TIMES+1}）")
                    time.sleep(RETRY_DELAY + random.uniform(1, 3))  # 重试间隔加随机值
            
            if not load_success:
                print(f"❌ 第 {page_num} 页加载失败，跳过此页")
                # 失败后增加等待，避免连续请求
                time.sleep(random.uniform(PAGE_DELAY_MAX, PAGE_DELAY_MAX + 5))
                continue

            # 模拟真人浏览行为
            simulate_human_behavior(page)

            # 提取当前页商品
            items = page.eles('css:div[data-qa*="productTile"]', timeout=8)
            item_count = 0

            for item in items:
                product_info = extract_product_info(item)
                if not product_info:
                    continue
                
                pid, name, curr_price = product_info
                today_online_ids.add(pid)
                item_count += 1

                # 新商品入库
                if pid not in db:
                    new_product_count += 1
                    print(f"✨ [新入库] {name} | {curr_price} (ID: {pid})")
                    db[pid] = {
                        "id": pid,
                        "name": name,
                        "current_price": curr_price,
                        "original_price": curr_price,
                        "first_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "last_change": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "update_at": datetime.now().strftime("%Y-%m-%d")
                    }
                # 价格变动检测
                else:
                    old_price = db[pid]['current_price']
                    if old_price != curr_price:
                        old_price_num = parse_price_to_num(old_price)
                        curr_price_num = parse_price_to_num(curr_price)
                        
                        if old_price_num and curr_price_num:
                            if curr_price_num < old_price_num:
                                discount_count += 1
                                discount_rate = (1 - curr_price_num/old_price_num) * 100
                                print(f"🎉 [优惠打折] {name}: {old_price} → {curr_price} (折扣：{discount_rate:.1f}%) (ID: {pid})")
                            elif curr_price_num > old_price_num:
                                rise_rate = ((curr_price_num/old_price_num) - 1) * 100
                                print(f"⚠️ [价格上涨] {name}: {old_price} → {curr_price} (涨幅：{rise_rate:.1f}%) (ID: {pid})")
                        else:
                            print(f"💰 [价格变动] {name}: {old_price} → {curr_price} (ID: {pid})")
                        
                        db[pid]['current_price'] = curr_price
                        db[pid]['last_change'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        db[pid]['update_at'] = datetime.now().strftime("%Y-%m-%d")

            # 当前页统计
            page_end = time.time()
            page_duration = page_end - page_start
            print(f"✅ 第 {page_num} 页扫描完成 | 有效商品：{item_count} | 耗时：{page_duration:.2f} 秒")

            # 每10页临时保存一次数据，防止崩溃丢失
            if page_num % 10 == 0:
                save_data_to_json(db)

            # 页间随机延迟（核心防封！）
            page_delay = random.uniform(PAGE_DELAY_MIN, PAGE_DELAY_MAX)
            print(f"⏳ 页间随机延迟 {page_delay:.2f} 秒（防封策略）")
            time.sleep(page_delay)

        # 侦测下架商品
        offline_ids = [sid for sid in db.keys() if sid not in today_online_ids]
        if offline_ids:
            print(f"\n🔍 侦测到 {len(offline_ids)} 个疑似下架/移除商品：")
            for sid in offline_ids[:10]:
                print(f"❌ {db[sid]['name']} (ID: {sid})")
            if len(offline_ids) > 10:
                print(f"   ... 还有 {len(offline_ids)-10} 个商品未显示")

        # 最终保存数据
        save_data_to_json(db)

        # 整体统计
        total_duration = time.time() - start_time
        print(f"\n───────────────────────────────────────")
        print(f"🏁 监控任务完成！")
        print(f"⏱️  总运行时间：{total_duration // 60:.0f} 分 {total_duration % 60:.2f} 秒")
        print(f"📊 平均每页耗时：{total_duration / MAX_PAGES_LIMIT:.2f} 秒")
        print(f"📈 当前数据库总商品数：{len(db)}")
        print(f"🌟 本次新入库商品：{new_product_count} 个")
        print(f"🎊 本次打折优惠商品：{discount_count} 个")

    except KeyboardInterrupt:
        print(f"\n🛑 用户手动中断程序，正在保存数据...")
        save_data_to_json(db)
    except Exception as e:
        print(f"\n❌ 程序执行异常中断：{e}")
        save_data_to_json(db)  # 异常时也保存数据
    finally:
        try:
            page.quit()
            print("\n🔌 浏览器已关闭")
        except:
            pass

if __name__ == "__main__":
    scrape_ps_store()
