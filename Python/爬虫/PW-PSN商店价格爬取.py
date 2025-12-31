import asyncio
import json
import os
import random
from datetime import datetime
from typing import Dict, List, Optional

from playwright.async_api import async_playwright, Page, Locator

# ===== 多页爬取配置 =====
BASE_URL = "https://store.playstation.com/zh-hant-hk/category/3f772501-f6f8-49b7-abac-874a88ca4897/{}"
DATA_FILE = "ps_game_prices.json"
CHECK_INTERVAL = 3600
HEADLESS_MODE = True
MAX_PAGES = 2  # 设置你想爬的总页数（比如20页）
PAGE_DELAY = (2, 5)
ITEM_DELAY = (0.2, 0.5)
RESUME_FILE = "resume.json"  # 现在记录已爬过的所有页码

# 修复Windows asyncio问题
def setup_asyncio_policy():
    if os.name == 'nt':
        try:
            import asyncio
            from asyncio import WindowsProactorEventLoopPolicy
            asyncio.set_event_loop_policy(WindowsProactorEventLoopPolicy())
            print("✅ 已设置Windows Proactor事件循环策略")
        except Exception as e:
            print(f"⚠️ 设置事件循环失败: {e}")

setup_asyncio_policy()

class PSGamePriceMonitor:
    def __init__(self):
        self.game_data: Dict[str, Dict] = {}
        self.load_existing_data()
        self.crawled_pages = set()  # 存储已爬过的页码（去重）
        self.load_resume_data()

    def load_existing_data(self):
        """加载历史价格数据"""
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    self.game_data = json.load(f)
                print(f"✅ 加载了 {len(self.game_data)} 个游戏的历史价格数据")
            except Exception as e:
                print(f"⚠️ 加载数据失败: {e}")
                self.game_data = {}

    def save_data(self):
        """保存价格数据"""
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.game_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 已保存 {len(self.game_data)} 个游戏的价格数据")
        except Exception as e:
            print(f"❌ 保存数据失败: {e}")

    def load_resume_data(self):
        """加载断点续爬数据（记录已爬过的所有页码）"""
        if os.path.exists(RESUME_FILE):
            try:
                with open(RESUME_FILE, 'r', encoding='utf-8') as f:
                    resume_data = json.load(f)
                    self.crawled_pages = set(resume_data.get('crawled_pages', []))
                print(f"✅ 断点续爬 - 已爬过 {len(self.crawled_pages)} 页: {sorted(list(self.crawled_pages))}")
            except Exception as e:
                print(f"⚠️ 加载断点数据失败: {e}")
                self.crawled_pages = set()
        else:
            self.crawled_pages = set()

    def save_resume_data(self):
        """保存断点续爬数据（已爬过的所有页码）"""
        try:
            resume_data = {
                'crawled_pages': sorted(list(self.crawled_pages)),
                'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_pages': len(self.crawled_pages),
                'total_games': len(self.game_data)
            }
            with open(RESUME_FILE, 'w', encoding='utf-8') as f:
                json.dump(resume_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ 保存断点数据失败: {e}")

    async def random_delay(self, min_delay: float, max_delay: float):
        """随机延时"""
        delay = random.uniform(min_delay, max_delay)
        await asyncio.sleep(delay)

    async def handle_page_load(self, page: Page):
        """处理页面加载"""
        await page.wait_for_load_state('domcontentloaded')
        
        # 处理Cookie提示
        try:
            cookie_accept = page.locator('button:has-text("接受")')
            if await cookie_accept.count() > 0:
                await cookie_accept.click()
                print("✅ 已接受Cookie政策")
        except:
            pass
        
        await page.wait_for_selector('li[class*="psw-l-w-1/2@mobile-s"]', timeout=30000)
        
        # 滚动加载所有内容
        for _ in range(3):
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            await asyncio.sleep(1)
        
        await asyncio.sleep(2)

    async def extract_game_info(self, page: Page, game_li: Locator) -> Optional[Dict]:
        """提取单个游戏信息"""
        try:
            await self.random_delay(*ITEM_DELAY)
            
            product_tile = game_li.locator('div[data-qa^="ems-sdk-grid#productTile"]')
            
            # 1. 获取标题
            title_elem = product_tile.locator('span[id="product-name"], span[data-qa*="#product-name"]')
            if await title_elem.count() == 0:
                return None
            title = await title_elem.inner_text()
            if not title:
                return None
            
            # 2. 获取价格
            price_info = {}
            # 折扣价
            discount_price_elem = product_tile.locator('span[data-qa*="#price#display-price"]')
            if await discount_price_elem.count() > 0:
                price_info['discount_price'] = await discount_price_elem.inner_text()
            # 原价
            original_price_elem = product_tile.locator('s[data-qa*="#price#price-strikethrough"]')
            if await original_price_elem.count() > 0:
                price_info['original_price'] = await original_price_elem.inner_text()
            # 折扣百分比
            discount_percent_elem = product_tile.locator('span[data-qa*="#discount-badge#text"]')
            if await discount_percent_elem.count() > 0:
                price_info['discount_percent'] = await discount_percent_elem.inner_text()
            
            # 3. 获取链接和ID
            link_elem = product_tile.locator('a[href^="/zh-hant-hk/product/"]')
            href = ""
            if await link_elem.count() > 0:
                href = await link_elem.get_attribute('href') or ""
                if href:
                    price_info['link'] = f"https://store.playstation.com{href}"
            game_id = href.split('/')[-1] if href else f"game_{hash(title)}"
            
            # 4. 获取平台信息
            platform_tags = []
            platform_elems = product_tile.locator('span[class*="psw-platform-tag"]')
            for i in range(await platform_elems.count()):
                try:
                    tag_text = await platform_elems.nth(i).inner_text()
                    platform_tags.append(tag_text)
                except:
                    continue
            price_info['platform'] = "/".join(platform_tags) if platform_tags else "未知"
            
            # 5. 组装数据
            game_info = {
                'id': game_id,
                'title': title.strip(),
                'prices': price_info,
                'last_checked': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'crawled_page': self.current_page  # 记录游戏来自哪一页
            }
            
            return game_info
            
        except Exception as e:
            return None

    async def is_page_empty(self, page: Page) -> bool:
        """判断当前页是否有游戏数据"""
        game_items = page.locator('li[class*="psw-l-w-1/2@mobile-s"]')
        count = await game_items.count()
        return count == 0

    async def scrape_page(self, page: Page, page_number: int) -> List[Dict]:
        """爬取单页数据（只爬未爬过的页面）"""
        # 如果页面已爬过，直接跳过
        if page_number in self.crawled_pages:
            print(f"⏭️ 第 {page_number} 页已爬过，跳过")
            return []
        
        self.current_page = page_number  # 记录当前页码
        url = BASE_URL.format(page_number)
        print(f"\n🔍 正在爬取第 {page_number} 页: {url}")
        
        try:
            await page.goto(url, timeout=60000)
            await self.handle_page_load(page)
            
            # 判断页面是否为空
            if await self.is_page_empty(page):
                print(f"⚠️ 第 {page_number} 页无数据，已到达最后一页")
                return []
            
            # 获取所有游戏项
            game_items = page.locator('li[class*="psw-l-w-1/2@mobile-s"]')
            item_count = await game_items.count()
            print(f"✅ 第 {page_number} 页找到 {item_count} 个游戏项")
            
            # 提取所有游戏
            games = []
            success_count = 0
            for i in range(item_count):
                game_li = game_items.nth(i)
                game_info = await self.extract_game_info(page, game_li)
                if game_info:
                    games.append(game_info)
                    success_count += 1
                
                # 显示进度
                if (i + 1) % 10 == 0:
                    print(f"  🔧 已处理 {i + 1}/{item_count} 个游戏 (成功: {success_count})")
            
            # 标记该页为已爬取
            self.crawled_pages.add(page_number)
            print(f"✅ 第 {page_number} 页提取完成 - 成功: {success_count}/{item_count} (已标记为已爬取)")
            return games
            
        except Exception as e:
            print(f"❌ 爬取第 {page_number} 页失败: {str(e)[:100]}")
            try:
                await page.screenshot(path=f"error_page_{page_number}.png")
                print(f"📸 已保存错误页面截图: error_page_{page_number}.png")
            except:
                pass
            return []

    def check_price_changes(self, new_game_info: Dict) -> Optional[Dict]:
        """检查价格变化"""
        game_id = new_game_info['id']
        title = new_game_info['title']
        
        if game_id not in self.game_data:
            self.game_data[game_id] = new_game_info
            return None
        
        old_data = self.game_data[game_id]
        old_prices = old_data.get('prices', {})
        new_prices = new_game_info.get('prices', {})
        
        changes = {}
        # 折扣价变化
        if old_prices.get('discount_price') != new_prices.get('discount_price'):
            changes['discount_price'] = {
                'old': old_prices.get('discount_price', '无'),
                'new': new_prices.get('discount_price', '无')
            }
        # 折扣百分比变化
        if old_prices.get('discount_percent') != new_prices.get('discount_percent'):
            changes['discount_percent'] = {
                'old': old_prices.get('discount_percent', '无'),
                'new': new_prices.get('discount_percent', '无')
            }
        
        self.game_data[game_id] = new_game_info
        return changes if changes else None

    async def run_multi_page_scraper(self):
        """智能多页爬取（只爬新页面）"""
        print("🚀 启动PS商店智能多页爬取程序")
        print(f"📅 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📄 计划爬取页数: 1 ~ {MAX_PAGES}")
        print(f"✅ 已爬过页数: {len(self.crawled_pages)} 页")
        print(f"🔍 待爬页数: {MAX_PAGES - len(self.crawled_pages)} 页")
        print(f"⏳ 每页间隔: {PAGE_DELAY[0]}-{PAGE_DELAY[1]} 秒")
        print("=" * 60)
        
        async with async_playwright() as p:
            # 启动浏览器
            browser = await p.chromium.launch(
                headless=HEADLESS_MODE,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            )
            
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                locale='zh-HK'
            )
            
            # 绕过检测
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'languages', { get: () => ['zh-HK', 'zh-CN', 'en'] });
            """)
            
            page = await context.new_page()
            
            total_new_games = 0
            total_new_pages = 0
            total_changes = 0
            
            try:
                # 遍历1~MAX_PAGES页，只爬未爬过的
                for page_num in range(1, MAX_PAGES + 1):
                    # 爬取当前页（已爬过会自动跳过）
                    games = await self.scrape_page(page, page_num)
                    
                    # 没有数据，说明到最后一页了
                    if not games and page_num not in self.crawled_pages:
                        print(f"\n🏁 爬取完成！已到达最后一页（第 {page_num - 1} 页）")
                        break
                    
                    # 统计新增数据
                    if games:
                        total_new_pages += 1
                        # 检查价格变化
                        page_changes = 0
                        for game in games:
                            if self.check_price_changes(game):
                                page_changes += 1
                        total_new_games += len(games)
                        total_changes += page_changes
                        
                        # 保存进度
                        self.save_data()
                        self.save_resume_data()
                        
                        print(f"📊 第 {page_num} 页统计 - 新增游戏: {len(games)} | 价格变动: {page_changes}")
                        
                        # 每页之间随机延时
                        await self.random_delay(*PAGE_DELAY)
                
            except KeyboardInterrupt:
                print(f"\n🛑 用户中断爬取，已保存当前进度")
            except Exception as e:
                print(f"\n❌ 爬取过程出错: {str(e)}")
            finally:
                # 最终保存
                self.save_data()
                self.save_resume_data()
                await page.close()
                await context.close()
                await browser.close()
            
            # 最终统计
            print("\n" + "=" * 60)
            print(f"📈 最终爬取统计:")
            print(f"   总计划页数: 1 ~ {MAX_PAGES}")
            print(f"   本次新增页数: {total_new_pages}")
            print(f"   累计已爬页数: {len(self.crawled_pages)}")
            print(f"   本次新增游戏: {total_new_games}")
            print(f"   累计游戏总数: {len(self.game_data)}")
            print(f"   本次价格变动: {total_changes}")
            print(f"   🚀 下次运行将从第 {len(self.crawled_pages) + 1} 页开始")
            print("=" * 60)

# ===== 运行智能多页爬取 =====
if __name__ == "__main__":
    monitor = PSGamePriceMonitor()
    asyncio.run(monitor.run_multi_page_scraper())
