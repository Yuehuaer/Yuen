import customtkinter as ctk
from PIL import Image, ImageTk
import requests
from bs4 import BeautifulSoup
from io import BytesIO
import threading
from concurrent.futures import ThreadPoolExecutor
import os
import json
import hashlib
import time
import webbrowser

# ==================== 1. 全局配置 ====================
ctk.set_appearance_mode("Light") 
ctk.set_default_color_theme("dark-blue") 

BASE_URL = "https://16k.club/"
CACHE_DIR = "saved_images"

FILE_IMG_CACHE = "cache_images.json"
FILE_NEWS_DOUYIN = "cache_douyin.json"
FILE_NEWS_WEIBO = "cache_weibo.json"
FILE_DOCKER_CACHE = "cache_docker.json"

# --- 配色方案 ---
COLOR_BG = "#F5F7FA"        
COLOR_CARD = "#FFFFFF"      
COLOR_PRIMARY = "#3B82F6"   
COLOR_TEXT_MAIN = "#333333" 
COLOR_TEXT_SUB = "#666666"  
COLOR_ACCENT = "#10B981"    

class UltimateGUI(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Python 全能看板 (V19.0 - 大图视觉版)") 
        self.geometry("1300x950")
        self.configure(fg_color=COLOR_BG)
        
        if not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)

        # === 布局配置 ===
        self.grid_columnconfigure(0, weight=1) 
        self.grid_columnconfigure(1, weight=4) 
        self.grid_rowconfigure(0, weight=0) 
        self.grid_rowconfigure(1, weight=1) 

        self.img_count = 0 
        # 10线程并发加载
        self.executor = ThreadPoolExecutor(max_workers=10)

        # === 加载模块 ===
        self.setup_left_sidebar()    
        self.setup_top_panel()       
        self.setup_image_flow()      

        # === 启动系统 ===
        self.load_all_local_cache() 
        self.after(2000, self.start_background_scheduler) 

    def load_all_local_cache(self):
        """启动时读取所有本地缓存"""
        threading.Thread(target=self._load_local_douyin, daemon=True).start()
        threading.Thread(target=self._load_local_weibo, daemon=True).start()
        threading.Thread(target=self._load_local_docker, daemon=True).start()
        threading.Thread(target=self._load_local_images, daemon=True).start()

    def start_background_scheduler(self):
        threading.Thread(target=self._scheduler_loop, daemon=True).start()

    def _scheduler_loop(self):
        print("⏰ [定时器] 后台更新服务已启动")
        while True:
            self.fetch_douyin_news()
            self.fetch_weibo_news()
            self.fetch_docker_versions()
            time.sleep(600) 

    # ==================== 左侧布局 (紧凑化调整) ====================
    def setup_left_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, fg_color=COLOR_CARD, corner_radius=0, width=280)
        self.sidebar.grid(row=0, column=0, rowspan=2, sticky="nsew", padx=(0, 1))

        # 标题区
        title_box = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        # 【修改点1】减少底部的 pady，从 10 改为 2，让下面的按钮提上来
        title_box.pack(pady=(30, 2), padx=20, fill="x")
        ctk.CTkLabel(title_box, text="🔥 实时热榜", font=("微软雅黑", 20, "bold"), text_color=COLOR_TEXT_MAIN).pack(anchor="w")
        self.news_status = ctk.CTkLabel(title_box, text="数据同步中...", text_color=COLOR_TEXT_SUB, font=("Arial", 11))
        self.news_status.pack(anchor="w")

        self.tabview = ctk.CTkTabview(self.sidebar, width=250, fg_color="transparent", text_color=COLOR_TEXT_MAIN)
        # 【修改点2】减少顶部的 pady，从 10 改为 (2, 10)，紧贴上面的标题
        self.tabview.pack(fill="both", expand=True, padx=10, pady=(2, 10))
        
        self.tabview.add("🎵 抖音")
        self.tabview.add("🔴 微博")
        self.scroll_douyin = ctk.CTkScrollableFrame(self.tabview.tab("🎵 抖音"), fg_color="transparent")
        self.scroll_douyin.pack(fill="both", expand=True)
        self.scroll_weibo = ctk.CTkScrollableFrame(self.tabview.tab("🔴 微博"), fg_color="transparent")
        self.scroll_weibo.pack(fill="both", expand=True)

    # ==================== 右侧布局 (保持不变) ====================
    def setup_top_panel(self):
        self.top_container = ctk.CTkFrame(self, fg_color="transparent")
        self.top_container.grid(row=0, column=1, padx=20, pady=(20, 10), sticky="new")
        self.top_container.grid_columnconfigure(0, weight=1)
        self.top_container.grid_columnconfigure(1, weight=1)

        self.version_frame = ctk.CTkFrame(self.top_container, fg_color=COLOR_CARD, corner_radius=10)
        self.version_frame.grid(row=0, column=0, padx=(0, 10), sticky="nsew")
        v_header = ctk.CTkFrame(self.version_frame, fg_color="transparent", height=40)
        v_header.pack(fill="x", padx=15, pady=(15, 5))
        ctk.CTkLabel(v_header, text="🐳 Docker 版本监控", font=("微软雅黑", 14, "bold"), text_color=COLOR_PRIMARY).pack(side="left")
        self.docker_status = ctk.CTkLabel(v_header, text="...", text_color=COLOR_TEXT_SUB, font=("Arial", 11))
        self.docker_status.pack(side="right")
        self.version_content = ctk.CTkFrame(self.version_frame, fg_color="transparent")
        self.version_content.pack(fill="both", expand=True, padx=10, pady=10)

        self.monitor_frame = ctk.CTkFrame(self.top_container, fg_color=COLOR_CARD, corner_radius=10)
        self.monitor_frame.grid(row=0, column=1, padx=(10, 0), sticky="nsew")
        m_header = ctk.CTkFrame(self.monitor_frame, fg_color="transparent", height=40)
        m_header.pack(fill="x", padx=15, pady=(15, 5))
        ctk.CTkLabel(m_header, text="📦 系统状态", font=("微软雅黑", 14, "bold"), text_color=COLOR_TEXT_MAIN).pack(side="left")
        self.price_scroll = ctk.CTkScrollableFrame(self.monitor_frame, height=100, fg_color="transparent")
        self.price_scroll.pack(fill="both", expand=True, padx=5, pady=5)
        ctk.CTkLabel(self.price_scroll, text="性能模式已开启\n多线程并行加速中", text_color=COLOR_TEXT_SUB).pack(pady=20)

    def setup_image_flow(self):
        self.img_frame = ctk.CTkFrame(self, fg_color=COLOR_CARD, corner_radius=10)
        self.img_frame.grid(row=1, column=1, padx=20, pady=(10, 20), sticky="nsew")
        top_bar = ctk.CTkFrame(self.img_frame, fg_color="transparent")
        top_bar.pack(fill="x", padx=20, pady=15)
        ctk.CTkLabel(top_bar, text="🖼️ 图片画廊", font=("微软雅黑", 18, "bold"), text_color=COLOR_TEXT_MAIN).pack(side="left")
        self.status_label = ctk.CTkLabel(top_bar, text="就绪", text_color=COLOR_TEXT_SUB, font=("Arial", 12))
        self.status_label.pack(side="left", padx=15)
        self.refresh_btn = ctk.CTkButton(top_bar, text="🔄 强制刷新", width=100, height=32,
                                         fg_color=COLOR_PRIMARY, hover_color="#1d4ed8", corner_radius=20,
                                         command=self.on_refresh_click)
        self.refresh_btn.pack(side="right")
        
        self.waterfall_scroll = ctk.CTkScrollableFrame(self.img_frame, fg_color="transparent")
        self.waterfall_scroll.pack(fill="both", expand=True, padx=10, pady=5)
        
        # 【修改点3】只配置 2 列 (0和1)，删掉第2列的配置
        self.waterfall_scroll.grid_columnconfigure(0, weight=1)
        self.waterfall_scroll.grid_columnconfigure(1, weight=1)
        # self.waterfall_scroll.grid_columnconfigure(2, weight=1) # 删除

    # ==================== 新闻逻辑 (省略重复代码) ====================
    def _load_local_douyin(self):
        if os.path.exists(FILE_NEWS_DOUYIN):
            try:
                with open(FILE_NEWS_DOUYIN, "r", encoding="utf-8") as f: data = json.load(f)
                self.after(0, lambda: self.render_news_list(data, self.scroll_douyin))
            except: pass
        else: self.fetch_douyin_news()

    def fetch_douyin_news(self):
        try:
            url = "https://api.codelife.cc/api/top/list"
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, params={"lang": "cn", "id": "DpQvNABoNE"}, timeout=5)
            data = response.json().get("data", [])
            with open(FILE_NEWS_DOUYIN, "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, indent=2)
            self.after(0, lambda: self.render_news_list(data, self.scroll_douyin))
            self.after(0, lambda: self.news_status.configure(text=f"抖音更新 {time.strftime('%H:%M')}", text_color=COLOR_ACCENT))
        except: pass

    def _load_local_weibo(self):
        if os.path.exists(FILE_NEWS_WEIBO):
            try:
                with open(FILE_NEWS_WEIBO, "r", encoding="utf-8") as f: data = json.load(f)
                self.after(0, lambda: self.render_news_list(data, self.scroll_weibo))
            except: pass
        else: self.fetch_weibo_news()

    def fetch_weibo_news(self):
        try:
            url = "https://api.codelife.cc/api/top/list"
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, params={"lang": "cn", "id": "KqndgxeLl9"}, timeout=5)
            data = response.json().get("data", [])
            with open(FILE_NEWS_WEIBO, "w", encoding="utf-8") as f: json.dump(data, f, ensure_ascii=False, indent=2)
            self.after(0, lambda: self.render_news_list(data, self.scroll_weibo))
            self.after(0, lambda: self.news_status.configure(text=f"微博更新 {time.strftime('%H:%M')}", text_color=COLOR_ACCENT))
        except: pass

    def render_news_list(self, news_list, target_frame):
        for widget in target_frame.winfo_children(): widget.destroy()
        for index, item in enumerate(news_list[:20]):
            display_text = f"{index+1}. {item.get('title', '无标题')}"
            if len(display_text) > 18: display_text = display_text[:18] + "..."
            btn = ctk.CTkButton(target_frame, text=display_text, height=35, fg_color="transparent", 
                                text_color=COLOR_TEXT_MAIN, hover_color="#F1F5F9", anchor="w", font=("微软雅黑", 12),
                                command=lambda u=item.get("url"): webbrowser.open(u) if u else None)
            btn.pack(fill="x", pady=1)

    # ==================== Docker 逻辑 ====================
    def _load_local_docker(self):
        if os.path.exists(FILE_DOCKER_CACHE):
            try:
                with open(FILE_DOCKER_CACHE, "r", encoding="utf-8") as f: data = json.load(f)
                self.after(0, lambda: self.update_docker_ui(data, from_cache=True))
            except: pass
        else: self.fetch_docker_versions()

    def fetch_docker_versions(self):
        try:
            url = "https://hub.docker.com/v2/namespaces/envyafish/repositories/byte-muse/tags"
            params = {"page_size": "5", "page": "1", "ordering": "last_updated"}
            headers = {"accept": "application/json", "user-agent": "Mozilla/5.0", "x-docker-api-client": "hub-ui/fetchWithAuth-v7565"}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            data = response.json()
            results = []
            if 'results' in data:
                for result in data['results'][:3]:
                    results.append((result['name'], result['tag_last_pushed'].split('T')[0]))
                self.after(0, lambda: self.update_docker_ui(results, from_cache=False))
                with open(FILE_DOCKER_CACHE, "w", encoding="utf-8") as f: json.dump(results, f, ensure_ascii=False, indent=2)
        except: pass

    def update_docker_ui(self, results, from_cache=False):
        status = "缓存" if from_cache else "已更新"
        self.docker_status.configure(text=status, text_color=COLOR_TEXT_SUB if from_cache else COLOR_ACCENT)
        for widget in self.version_content.winfo_children(): widget.destroy()
        h_row = ctk.CTkFrame(self.version_content, fg_color="transparent")
        h_row.pack(fill="x", pady=(0, 5))
        ctk.CTkLabel(h_row, text="VERSION", width=120, anchor="w", font=("Arial", 10, "bold"), text_color=COLOR_TEXT_SUB).pack(side="left")
        ctk.CTkLabel(h_row, text="DATE", width=80, anchor="e", font=("Arial", 10, "bold"), text_color=COLOR_TEXT_SUB).pack(side="right")
        for name, date in results:
            row = ctk.CTkFrame(self.version_content, fg_color="#F8FAFC", corner_radius=6)
            row.pack(fill="x", pady=3)
            ctk.CTkLabel(row, text=name, width=120, anchor="w", text_color=COLOR_PRIMARY, font=("Consolas", 12, "bold")).pack(side="left", padx=10, pady=5)
            ctk.CTkLabel(row, text=date, width=80, anchor="e", text_color=COLOR_TEXT_SUB, font=("Arial", 11)).pack(side="right", padx=10)

    # ==================== 【重构】图片极速加载 & 布局 ====================
    def _load_local_images(self):
        if os.path.exists(FILE_IMG_CACHE):
            try:
                self.status_label.configure(text="极速加载中...")
                with open(FILE_IMG_CACHE, "r", encoding="utf-8") as f:
                    data_list = json.load(f)
                
                self.img_count = 0
                for item in data_list:
                    self.executor.submit(self.process_and_show_image, item)
                
                self.update_status(f"图库加载完毕 ({len(data_list)})")
            except: pass
        else:
            self.on_refresh_click()

    def process_and_show_image(self, item):
        local_path = item["path"]
        name = item["name"]
        
        if os.path.exists(local_path):
            try:
                pil_image = Image.open(local_path)
                # 【修改点4】加大缩略图尺寸，适配双列布局
                # 从 (260, 180) 加大到 (400, 280)，保证大图清晰
                thumb_img = pil_image.copy()
                thumb_img.thumbnail((400, 280), Image.Resampling.LANCZOS)
                self.after(0, lambda: self.add_image_to_grid(thumb_img, name, local_path))
            except: pass

    def on_refresh_click(self):
        self.refresh_btn.configure(state="disabled", text="正在采集...", fg_color=COLOR_TEXT_SUB)
        self.img_count = 0 
        for widget in self.waterfall_scroll.winfo_children():
            widget.destroy()
        threading.Thread(target=self.crawler_logic, daemon=True).start()

    def crawler_logic(self):
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            tasks = []
            
            for page in range(1, 6):
                if len(tasks) >= 80: break 
                self.update_status(f"正在扫描第 {page} 页...")
                url = BASE_URL if page == 1 else f"{BASE_URL}page/{page}/"
                try:
                    response = requests.get(url, headers=headers, timeout=5)
                    soup = BeautifulSoup(response.text, "html.parser")
                    for img in soup.find_all("img"):
                        src = img.get("src") or img.get("data-src")
                        name = img.get("alt") or "未命名"
                        if src and src.startswith("http") and not any(x in src for x in ["logo", "icon", "avatar"]):
                            if not any(t[0] == src for t in tasks):
                                tasks.append((src, name))
                except: pass
                time.sleep(0.5)

            # 下载
            self.crawled_data = []
            count = 0
            self.update_status(f"正在下载资源...")
            
            for url, name in tasks:
                if count >= 60: break
                success = self.download_and_save(url, name)
                if success: count += 1

            with open(FILE_IMG_CACHE, "w", encoding="utf-8") as f:
                json.dump(self.crawled_data, f, ensure_ascii=False, indent=2)
            
            self.update_status("更新完成")
            self.after(0, lambda: self.refresh_btn.configure(state="normal", text="🔄 强制刷新", fg_color=COLOR_PRIMARY))
        except:
            self.update_status("更新失败")
            self.after(0, lambda: self.refresh_btn.configure(state="normal", text="🔄 强制刷新", fg_color=COLOR_PRIMARY))

    def download_and_save(self, url, name):
        try:
            filename = hashlib.md5(url.encode()).hexdigest() + ".jpg"
            save_path = os.path.join(CACHE_DIR, filename)
            if not os.path.exists(save_path):
                r = requests.get(url, timeout=5)
                with open(save_path, "wb") as f: f.write(r.content)
            
            self.crawled_data.append({"name": name, "path": save_path})
            item = {"name": name, "path": save_path}
            self.executor.submit(self.process_and_show_image, item)
            return True
        except: 
            return False

    def add_image_to_grid(self, thumb_img, name_text, image_path):
        try:
            if self.img_count >= 60: return

            # 【修改点5】核心：改为双列布局计算
            row = self.img_count // 2 # 除以2
            col = self.img_count % 2  # 取余2
            
            # 【修改点6】加大卡片高度
            # 从 260 加大到 350，容纳更大的图片
            card = ctk.CTkFrame(self.waterfall_scroll, fg_color=COLOR_CARD, height=350, cursor="hand2")
            card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew") # padx加大一点
            card.grid_propagate(False) 

            # 1. 图片部分
            ctk_img = ctk.CTkImage(light_image=thumb_img, dark_image=thumb_img, size=thumb_img.size)
            img_label = ctk.CTkLabel(card, text="", image=ctk_img, cursor="hand2")
            img_label.pack(side="top", pady=(20, 10)) # pady加大
            
            # 2. 文字部分
            display_name = name_text[:15] + "..." if len(name_text) > 15 else name_text
            # 加大字号到 13
            txt_label = ctk.CTkLabel(card, text=display_name, font=("微软雅黑", 13, "bold"), text_color=COLOR_TEXT_MAIN, cursor="hand2")
            txt_label.pack(side="top", pady=0)
            
            # 点击事件
            callback = lambda event, path=image_path, title=name_text: self.show_image_viewer(path, title)
            card.bind("<Button-1>", callback)
            img_label.bind("<Button-1>", callback)
            txt_label.bind("<Button-1>", callback)

            self.img_count += 1
        except: pass

    def show_image_viewer(self, image_path, title):
        if not os.path.exists(image_path): return
        viewer = ctk.CTkToplevel(self)
        viewer.title(title)
        viewer.geometry("900x700")
        viewer.grab_set()
        viewer.attributes('-topmost', True)
        viewer.configure(fg_color="#1a1a1a")
        try:
            original_img = Image.open(image_path)
            original_img.thumbnail((850, 600), Image.Resampling.LANCZOS)
            tk_img = ctk.CTkImage(light_image=original_img, dark_image=original_img, size=original_img.size)
            img_label = ctk.CTkLabel(viewer, text="", image=tk_img)
            img_label.pack(expand=True, padx=20, pady=20)
            close_btn = ctk.CTkButton(viewer, text="关闭", width=100, fg_color="#333", hover_color="#555", command=viewer.destroy)
            close_btn.pack(pady=20)
        except: pass

    def update_status(self, text):
        self.after(0, lambda: self.status_label.configure(text=text))

if __name__ == "__main__":
    app = UltimateGUI()
    app.mainloop()
