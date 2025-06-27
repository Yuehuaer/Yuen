import tkinter as tk
from tkinter import messagebox, scrolledtext
import threading
import time
import subprocess
import pyautogui
from pystray import MenuItem as item
import pystray
from PIL import Image, ImageDraw
import queue


class WeChatLocker:
    def __init__(self, root):
        self.root = root
        self.root.title("微信自动锁")

        # --- GUI Elements ---
        main_frame = tk.Frame(root)
        main_frame.pack(padx=10, pady=10)

        tk.Label(main_frame, text="手机IP地址:").grid(row=0, column=0, sticky='w', pady=2)
        self.ip_entry = tk.Entry(main_frame, width=25)
        self.ip_entry.grid(row=0, column=1, pady=2)

        tk.Label(main_frame, text="间隔时间(秒):").grid(row=1, column=0, sticky='w', pady=2)
        self.interval_entry = tk.Entry(main_frame, width=25)
        self.interval_entry.grid(row=1, column=1, pady=2)
        self.interval_entry.insert(0, "5")

        button_frame = tk.Frame(main_frame)
        button_frame.grid(row=2, columnspan=2, pady=10)
        self.start_button = tk.Button(button_frame, text="运行", command=self.start_locking)
        self.start_button.pack(side=tk.LEFT, padx=5)
        self.stop_button = tk.Button(button_frame, text="停止", command=self.stop_locking, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT, padx=5)

        tk.Label(main_frame, text="运行信息:").grid(row=3, column=0, sticky='w', pady=2)
        self.info_display = scrolledtext.ScrolledText(main_frame, height=10, width=40, state='normal')
        self.info_display.grid(row=4, columnspan=2, pady=5)
        self.info_display.insert(tk.END,
                                 "为避免误ping，连续2次ping不通才会锁定\n建议间隔时间30秒（30秒×2=1分钟）")
        self.info_display.config(state='disabled')

        # --- State and Threading ---
        self.is_running = False
        self.thread = None
        self.message_queue = queue.Queue()

        # --- System Tray and Window Management ---
        self.root.protocol("WM_DELETE_WINDOW", self.hide_to_tray)
        self.icon = None
        self.process_queue()

    def log_message(self, message):
        self.message_queue.put(message)

    def process_queue(self):
        try:
            while True:
                message = self.message_queue.get_nowait()
                self.info_display.config(state='normal')
                self.info_display.insert(tk.END, f"{time.strftime('%H:%M:%S')} - {message}\n")
                self.info_display.see(tk.END)
                self.info_display.config(state='disabled')
        except queue.Empty:
            pass
        self.root.after(100, self.process_queue)

    def create_image(self):
        image = Image.new('RGB', (64, 64), 'black')
        dc = ImageDraw.Draw(image)
        dc.rectangle((10, 10, 54, 54), fill='white')
        return image

    def hide_to_tray(self):
        self.root.withdraw()
        image = self.create_image()
        menu = (item('显示', self.show_window), item('退出', self.quit_window))
        self.icon = pystray.Icon("WeChatLocker", image, "微信自动锁定", menu)
        self.icon.run()

    def show_window(self):
        if self.icon:
            self.icon.stop()
        self.root.deiconify()

    def quit_window(self):
        self.stop_locking()
        if self.icon:
            self.icon.stop()
        self.root.destroy()

    def start_locking(self):
        ip = self.ip_entry.get()
        interval_str = self.interval_entry.get()

        if not ip:
            messagebox.showerror("错误", "请输入IP地址")
            return
        try:
            interval = int(interval_str)
            if interval <= 0:
                raise ValueError
        except ValueError:
            messagebox.showerror("错误", "间隔时间必须是正整数")
            return

        self.is_running = True
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.log_message(f"开始监控IP: {ip}")

        self.thread = threading.Thread(target=self.ping_loop, args=(ip, interval), daemon=True)
        self.thread.start()

    def stop_locking(self):
        if self.is_running:
            self.is_running = False
            self.log_message("监控已停止")
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)

    def ping_loop(self, ip, interval):
        was_pingable = True
        failure_count = 0
        while self.is_running:
            command = ["ping", "-n", "1", "-w", "2000", ip]
            ping_success = False
            try:
                result = subprocess.run(
                    command,
                    check=False,
                    capture_output=True,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )
                if result.returncode == 0:
                    ping_success = True
            except Exception as e:
                self.log_message(f"Ping命令执行出错: {e}")

            if ping_success:
                failure_count = 0
            else:
                failure_count += 1

            is_pingable = failure_count < 2

            if is_pingable:
                if not was_pingable:
                    self.log_message(f"Ping {ip} 成功，连接已恢复。")
                else:
                    self.log_message(f"Ping {ip} 成功，状态正常 (失败次数: {failure_count})")
            else:  # is_pingable is False
                if was_pingable:
                    self.log_message(f"Ping {ip} 连续失败2次，准备锁定微信。")
                    self.lock_wechat()
                else:
                    self.log_message(f"Ping {ip} 持续失败 (次数: {failure_count})，微信已锁定，无需重复操作。")

            was_pingable = is_pingable

            for _ in range(interval):
                if not self.is_running:
                    break
                time.sleep(1)

    def lock_wechat(self):
        try:
            self.log_message("执行快捷键 Ctrl+Q 打开微信")
            pyautogui.hotkey('Alt', 'q')
            time.sleep(0.5)  # 等待微信窗口出现
            self.log_message("执行快捷键 Ctrl+L 锁定微信")
            pyautogui.hotkey('ctrl', 'l')
            time.sleep(0.5)  # 等待锁定完成
            pyautogui.hotkey('Alt', 'q')  # 再次执行打开微信快捷键来隐藏微信
            self.log_message("微信已锁定并隐藏")
        except Exception as e:
            self.log_message(f"锁定微信时出错: {e}")


if __name__ == "__main__":
    root = tk.Tk()
    app = WeChatLocker(root)
    root.mainloop()
