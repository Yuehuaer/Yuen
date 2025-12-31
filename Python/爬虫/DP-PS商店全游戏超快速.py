import json
import time
import os
import re
from drissionpage import ChromiumPage, ChromiumOptions

# ================= 配置區域 =================
JSON_FILENAME = 'ps_store_monitor.json'
MAX_PAGES_LIMIT = 10
HEADLESS_MODE = True
# ============================================

def scrape_ps_store():
    start_time = time.time()  # 💡 記錄程式開始時間
    co = ChromiumOptions().headless(HEADLESS_MODE)
    page = ChromiumPage(co)
    
    # 加載現有數據
    db = {}
    if os.path.exists(JSON_FILENAME):
        with open(JSON_FILENAME, 'r', encoding='utf-8') as f:
            try:
                data_list = json.load(f)
                db = {str(item['id']): item for item in data_list}
                print(f"📂 資料庫載入完成，共有 {len(db)} 筆紀錄")
            except: pass

    today_online_ids = set()

    try:
        pages_to_run = MAX_PAGES_LIMIT 

        for i in range(1, pages_to_run + 1):
            page_start = time.time()  # 💡 記錄每一頁開始的時間
            url = f"https://store.playstation.com/zh-hant-hk/pages/browse/{i}"
            
            print(f"\n───────────────────────────────────────")
            print(f"📄 [進度 {i}/{pages_to_run}] 正在掃描第 {i} 頁...")
            
            page.get(url)
            page.scroll.to_bottom()
            time.sleep(0.5)

            items = page.eles('css:div[data-qa*="productTile"]')
            item_count = 0
            
            for item in items:
                try:
                    link_ele = item.ele('css:a.psw-link', timeout=0)
                    if not link_ele: continue
                    pid = re.search(r'/concept/(\d+)', link_ele.attr('href')).group(1)
                    name = item.ele('css:#product-name').text
                    
                    price_ele = item.ele('css:span[data-qa*="price#display-price"]')
                    curr_price = price_ele.text if price_ele else "HK$0"
                    
                    today_online_ids.add(pid) 
                    item_count += 1

                    if pid in db:
                        if db[pid]['current_price'] != curr_price:
                            print(f"💰 [價格變動] {name}: {db[pid]['current_price']} -> {curr_price}")
                            db[pid]['current_price'] = curr_price
                            db[pid]['last_change'] = time.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        print(f"✨ [新入庫] {name} | {curr_price}")
                        db[pid] = {
                            "id": pid, "name": name, "current_price": curr_price,
                            "update_at": time.strftime("%Y-%m-%d")
                        }
                except: continue

            page_end = time.time()
            print(f"✅ 第 {i} 頁掃描完成，抓取 {item_count} 個項目 (本頁耗時: {page_end - page_start:.2f} 秒)")

        # 🔍 監控：消失的遊戲
        for stored_id in list(db.keys()):
            if stored_id not in today_online_ids:
                print(f"❌ [疑似下架/移除] {db[stored_id]['name']} (ID: {stored_id})")

        # 儲存
        with open(JSON_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(list(db.values()), f, ensure_ascii=False, indent=4)
        
        end_time = time.time() # 💡 記錄程式結束時間
        total_duration = end_time - start_time
        
        print(f"\n───────────────────────────────────────")
        print(f"🏁 監控任務完成！")
        print(f"⏱️  總共運行時間: {total_duration // 60:.0f} 分 {total_duration % 60:.2f} 秒")
        print(f"📊 平均每頁耗時: {total_duration / pages_to_run:.2f} 秒")

    finally:
        page.quit()

if __name__ == "__main__":
    scrape_ps_store()
