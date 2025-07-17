from Sbxx import Sbxx
import time
import pyautogui as pa
import pyperclip
import random
import os
import sys
import json
from pynput import keyboard
# 在代码最开始添加（需要先安装 `psutil`：pip install psutil）
import psutil
import os


def check_duplicate():
    """检查是否有相同程序正在运行"""
    current_pid = os.getpid()
    process_name = os.path.basename(__file__).replace(".py", ".exe")  # 适配 EXE 名称
    for proc in psutil.process_iter(['name', 'pid']):
        if proc.info['name'] == process_name and proc.info['pid'] != current_pid:
            pa.alert("程序已在运行中，请勿重复启动", "提示")
            exit()  # 退出当前实例


# 启动时检查
check_duplicate()

# 全局变量：控制循环停止
stop_flag = False

# 新增：定义 current_company 变量
current_company = "无"


def on_press(key):
    """监听键盘事件，按F3立即停止程序"""
    global stop_flag
    if key == keyboard.Key.f3:
        stop_flag = True
        print("\n检测到F3按键，程序将立即停止...")
        return False  # 停止监听


# 获取资源路径（兼容打包后环境）
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS  # 打包后路径
    except:
        base_path = os.path.dirname(os.path.abspath(__file__))  # 开发环境路径
    return os.path.join(base_path, relative_path)


# 读取公司数据
json_file_path = resource_path("gs.json")
try:
    with open(json_file_path, 'r', encoding='utf-8') as f:
        company_list = json.load(f)
    print(f"✅ 加载 {len(company_list)} 家公司数据")
except Exception as e:
    pa.alert(f"错误: 无法加载 gs.json\n{e}", "致命错误")
    company_list = []

# 初始化图片工具
img_dir = resource_path("img")
sb_tool = Sbxx(confidence=0.8, default_img_dir=img_dir)

# 启动键盘监听
listener = keyboard.Listener(on_press=on_press)
listener.start()

print("程序运行中，按F3可随时停止...")

# 主循环
loop_flag = True
index = 0
processed_companies = 0

while loop_flag and not stop_flag and company_list:
    company = company_list[index]
    gs_text = company.get("gs_text", "未知公司")
    gs_mima = company.get("gs_mima", "")

    # 更新当前公司名称
    current_company = gs_text

    print(f"\n🔵 开始处理公司 {index + 1}/{len(company_list)}: {gs_text}")

    # 登录流程
    rj = sb_tool.find_image_position("rj.png")
    if stop_flag: break
    pa.click(rj, clicks=2, duration=0.5)
    time.sleep(5)

    pa.click(1061, 403)  # 选择输入框
    time.sleep(1)

    qxz = sb_tool.find_image_position("qxz.png")
    pa.click(qxz)
    time.sleep(3)

    # 输入公司名称（带重试）
    for char in gs_text:
        if stop_flag: break
        for attempt in range(5):
            if stop_flag: break
            try:
                pyperclip.copy(char)
                pa.hotkey('ctrl', 'v')
                time.sleep(random.uniform(0.9, 1))            #B延长时间
                break
            except Exception as e:
                print(f"字符 '{char}' 粘贴失败: {e}")
                time.sleep(0.5)
    if stop_flag: break

    # 输入密码
    pa.moveRel(0, 25)
    pa.click()
    time.sleep(1)
    if stop_flag:
        break  # 检查是否需要停止

    qsrmm = sb_tool.find_image_position("qsrmm.png")
    time.sleep(1)
    pa.click(qsrmm, clicks=1, duration=0.5)
    time.sleep(1)
    if stop_flag:
        break  # 检查是否需要停止

    pa.write(gs_mima)
    time.sleep(0.5)
    pa.press('enter')
    if stop_flag:
        break  # 检查是否需要停止

    dl = sb_tool.find_image_position("dl.png")
    pa.click(dl, clicks=1, duration=0.5)
    time.sleep(15)
    if stop_flag:
        break  # 检查是否需要停止

    '''进入了系统'''
    qd = sb_tool.find_image_position("qd.png")
    if qd:
        pa.click(qd, clicks=1, duration=0.5)
    else:
        time.sleep(4)
    if stop_flag:
        break  # 检查是否需要停止

    '''综合所得申报'''
    zhsdsb = sb_tool.find_image_position("zhsdsb.png")
    pa.click(zhsdsb, clicks=1, duration=0.5)
    time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    zbtz = sb_tool.find_image_position("zbtz.png")
    if zbtz:
        print("✅ 找到'暂不跳转'按钮")
        pa.click(zbtz, clicks=1, duration=0.5)
        time.sleep(5)
    else:
        print("⚠️ 未找到'暂不跳转'按钮，跳过此步骤")
        # 可以添加额外处理逻辑，如尝试其他方法或直接继续
        time.sleep(1)  # 保持短暂等待以确保流程稳定
    if stop_flag:
        break  # 检查是否需要停止

    gzxj = sb_tool.find_image_position("gzxj.png")
    pa.click(gzxj, clicks=1, duration=0.5)
    time.sleep(5)
    if stop_flag:
        break  # 检查是否需要停止

    ljxz = sb_tool.find_image_position("ljxz.png")
    if ljxz:
        print("✅ 找到'立即下载'按钮")
        pa.click(ljxz, clicks=1, duration=0.5)
    else:
        print("⚠️ 未找到'立即下载'按钮，跳过此步骤")
        time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    zqd = sb_tool.find_image_position("zqd.png")
    if zqd:
        print("✅ 找到'zqd'按钮")
        pa.click(ljxz, clicks=1, duration=0.5)
    else:
        print("⚠️ 未找到'zqd'按钮，跳过此步骤")
        time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    xqd = sb_tool.find_image_position("xqd.png")
    if xqd:
        print("✅ 找到'小确定'按钮")
        pa.click(xqd, clicks=1, duration=0.5)
    else:
        print("⚠️ 未找到'小确定'按钮，跳过此步骤")
        time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    fzsy = sb_tool.find_image_position("fzsy.png")         # 使用这个，上月必须在此电脑申报过才可以用，可以替换生成0工资
    pa.click(fzsy, clicks=1, duration=0.5)
    time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止



    lj = sb_tool.find_image_position("lj.png")
    pa.click(lj, clicks=1, duration=0.5)
    time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    dgb = sb_tool.find_image_position("dgb.png")
    if dgb:
        print("✅ 找到'dgb'按钮")
        pa.click(dgb, clicks=1, duration=0.5)
    else:
        print("⚠️ 未找到'dqb'按钮，跳过此步骤")
        time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止


    xqd = sb_tool.find_image_position("xqd.png")
    if xqd:
        print("✅ 找到'xqd'按钮")
        pa.click(xqd, clicks=1, duration=0.5)
    else:
        print("⚠️ 未找到'xqd'按钮，跳过此步骤")
        time.sleep(3)
    if stop_flag:
        break  # 检查是否需要停止

    fh = sb_tool.find_image_position("fh.png")
    pa.click(fh, clicks=1, duration=0.5)
    time.sleep(1)
    if stop_flag:
        break  # 检查是否需要停止

    skjs = sb_tool.find_image_position("skjs.png")
    pa.click(skjs, clicks=1, duration=0.5)
    time.sleep(20)
    if stop_flag:
        break  # 检查是否需要停止

    xqd = sb_tool.find_image_position("xqd.png")
    if xqd:
        pa.click(xqd, clicks=1, duration=0.5)
    else:
        time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    fbtx = sb_tool.find_image_position("fbtx.png")
    pa.click(fbtx, clicks=1, duration=0.5)
    time.sleep(3)
    if stop_flag:
        break  # 检查是否需要停止

    sbbbs = sb_tool.find_image_position("sbbbs.png")
    pa.click(sbbbs, clicks=1, duration=0.5)
    time.sleep(1)
    if stop_flag:
        break  # 检查是否需要停止

    fssb = sb_tool.find_image_position("fssb.png")
    pa.click(fssb, clicks=1, duration=0.5)
    time.sleep(20)
    if stop_flag:
        break  # 检查是否需要停止

    ljhq = sb_tool.find_image_position("ljhq.png")
    pa.click(ljhq, clicks=1, duration=0.5)  # 修正点击对象
    time.sleep(5)
    if stop_flag:
        break  # 检查是否需要停止

    xqd = sb_tool.find_image_position("xqd.png")
    pa.click(xqd, clicks=1, duration=0.5)
    time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    '''关闭系统'''
    gb = sb_tool.find_image_position("gb.png")
    pa.click(gb, clicks=1, duration=0.5)
    time.sleep(2)
    if stop_flag:
        break  # 检查是否需要停止

    gbqd = sb_tool.find_image_position("gbqd.png")
    pa.click(gbqd, clicks=1, duration=0.5)
    time.sleep(3)
    if stop_flag:
        break  # 检查是否需要停止

    gbqd = sb_tool.find_image_position("gbqd.png")
    pa.click(gbqd, clicks=1, duration=0.5)
    time.sleep(3)
    if stop_flag:
        break  # 检查是否需要停止

    index += 1
    processed_companies += 1
    print(f"✅ 公司 {processed_companies}/{len(company_list)} 处理完成")

# 结束程序（重点：按F3后弹窗提示）
listener.stop()
listener.join()
print("所有线程已停止")

# 按F3停止后弹窗提示
if stop_flag:
    pa.alert(
        f"程序已停止\n"
        f"-------------------\n"
        f"已处理公司：{processed_companies}/{len(company_list)}\n"
        f"当前处理到：{current_company}\n"
        f"-------------------\n"
        f"重新打开程序可继续处理",
        "已停止"
    )
elif company_list:  # 所有公司处理完成
    pa.alert(
        f"所有公司处理完毕\n"
        f"共处理：{len(company_list)} 家公司",
        "完成"
    )
else:  # 无公司数据
    pa.alert("未找到可处理的公司数据", "提示")


