import pyautogui
import time
import xlrd
import pyperclip
import os

# ====== 操作类型常量 ======
CMD_CLICK = 1.0  # 左键单击
CMD_DOUBLE_CLICK = 2.0  # 左键双击
CMD_RIGHT_CLICK = 3.0  # 右键单击
CMD_INPUT = 4.0  # 输入文本
CMD_WAIT = 5.0  # 等待时间
CMD_SCROLL = 6.0  # 滚轮滑动
CMD_HOTKEY = 7.0  # 热键组合
CMD_TIME = 8.0  # 粘贴当前时间
CMD_SYSTEM = 9.0  # 系统命令
CMD_COORD_CLICK = 10.0  # 坐标单击
CMD_COORD_DOUBLE = 11.0  # 坐标双击
CMD_FALLBACK_CLICK = 12.0  # 混合模式


# ====== 定义鼠标事件函数 ======
def mouseClick(clickTimes, lOrR, img, reTry):
    """
    图片识别点击功能
    :param clickTimes: 点击次数
    :param lOrR: 鼠标按钮（'left'或'right'）
    :param img: 图片路径
    :param reTry: 重试次数
    """
    if reTry == 1:
        while True:
            location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
            if location is not None:
                pyautogui.click(location.x, location.y, clicks=clickTimes,
                                interval=0.2, duration=0.2, button=lOrR)
                break
            print("未找到匹配图片,0.1秒后重试")
            time.sleep(0.1)
    elif reTry == -1:
        while True:
            location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
            if location is not None:
                pyautogui.click(location.x, location.y, clicks=clickTimes,
                                interval=0.2, duration=0.2, button=lOrR)
            time.sleep(0.1)
    elif reTry > 1:
        i = 1
        while i < reTry + 1:
            location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
            if location is not None:
                pyautogui.click(location.x, location.y, clicks=clickTimes,
                                interval=0.2, duration=0.2, button=lOrR)
                print("重复")
                i += 1
            time.sleep(0.1)


# ====== 定义热键事件函数 ======
def hotkey_get(hk_g_inputValue):
    """
    处理热键组合或文本输入
    :param hk_g_inputValue: 热键组合（如'enter'）或文本内容
    """
    try:
        # 特殊处理单个数字键
        if hk_g_inputValue.isdigit():
            pyautogui.press(hk_g_inputValue)
        else:
            keys = hk_g_inputValue.split(',')
            if len(keys) == 1:
                pyautogui.press(keys[0])
            else:
                pyautogui.hotkey(*keys)
    except:
        pyperclip.copy(hk_g_inputValue)
        pyautogui.hotkey('ctrl', 'v')


def hotkeyGroup(reTry, hkg_inputValue):
    """
    执行热键操作
    :param reTry: 重试次数
    :param hkg_inputValue: 热键值
    """
    if reTry == 1:
        hotkey_get(hkg_inputValue)
        print(f"执行了：{hkg_inputValue}")
        time.sleep(0.1)
    elif reTry == -1:
        while True:
            hotkey_get(hkg_inputValue)
            print(f"执行了：{hkg_inputValue}")
            time.sleep(0.1)
    elif reTry > 1:
        i = 1
        while i < reTry + 1:
            hotkey_get(hkg_inputValue)
            print(f"执行了：{hkg_inputValue}")
            i += 1
            time.sleep(0.1)


# ====== 坐标工具函数 ======
def record_coordinates():
    """
    坐标记录工具 - 按空格记录当前位置，ESC退出
    :return: 记录的坐标列表
    """
    print("\n=== 坐标记录模式 ===")
    print("操作说明:")
    print("1. 移动鼠标到需要记录的位置")
    print("2. 按空格键记录当前位置")
    print("3. 按ESC键退出记录模式")
    print("==================")

    recorded_points = []

    try:
        while True:
            # 检测空格键按下
            if pyautogui.keyDown(' '):
                x, y = pyautogui.position()
                recorded_points.append((x, y))
                print(f"已记录坐标 {len(recorded_points)}: ({x}, {y})")
                pyautogui.keyUp(' ')  # 释放空格键
                time.sleep(0.3)  # 防连按

            # 检测ESC键按下
            if pyautogui.keyDown('esc'):
                print("退出记录模式")
                break

            time.sleep(0.05)
    except KeyboardInterrupt:
        print("记录模式被中断")

    # 复制所有坐标到剪贴板
    if recorded_points:
        coord_str = "\n".join([f"{x},{y}" for x, y in recorded_points])
        pyperclip.copy(coord_str)
        print(f"\n已复制{len(recorded_points)}个坐标到剪贴板:")
        print(coord_str)
        print("提示：在Excel中创建坐标操作指令：")
        print("| 操作类型 | X坐标 | Y坐标 | 内容 | 重复次数 | 备用坐标 | 备注 |")
        print("|----------|-------|-------|------|----------|----------|------|")
        for x, y in recorded_points:
            print(f"| 10.0     | {x}   | {y}   |      | 1        |          |      |")

    return recorded_points


# ====== 数据检查函数 ======
def dataCheck(sheet1):
    """
    检查Excel指令表数据有效性
    :param sheet1: Excel工作表对象
    :return: 检查结果（True/False）
    """
    checkCmd = True
    # 行数检查
    if sheet1.nrows < 2:
        print("错误：指令表中没有数据")
        checkCmd = False

    # 每行数据检查（从第2行开始，跳过标题行）
    for i in range(1, sheet1.nrows):
        row = sheet1.row(i)

        # 检查指令类型
        cmdType = row[0]
        valid_cmds = [
            CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK,
            CMD_INPUT, CMD_WAIT, CMD_SCROLL, CMD_HOTKEY,
            CMD_TIME, CMD_SYSTEM, CMD_COORD_CLICK,
            CMD_COORD_DOUBLE, CMD_FALLBACK_CLICK
        ]

        if cmdType.ctype != 2 or cmdType.value not in valid_cmds:
            print(f'第{i + 1}行,A列: 无效的操作类型')
            checkCmd = False

        # 根据指令类型检查对应列
        cmd_value = row[3]  # D列: 内容

        # 图片点击类型指令，内容必须为字符串
        if cmdType.value in [CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK]:
            if cmd_value.ctype != 1:
                print(f'第{i + 1}行,D列: 图片路径应为字符串')
                checkCmd = False

        # 输入类型，内容不能为空
        if cmdType.value == CMD_INPUT:
            if cmd_value.ctype == 0:
                print(f'第{i + 1}行,D列: 输入内容不能为空')
                checkCmd = False

        # 等待类型，内容必须为数字
        if cmdType.value == CMD_WAIT:
            if cmd_value.ctype != 2:
                print(f'第{i + 1}行,D列: 等待时间应为数字')
                checkCmd = False

        # 滚轮事件，内容必须为数字
        if cmdType.value == CMD_SCROLL:
            if cmd_value.ctype != 2:
                print(f'第{i + 1}行,D列: 滚轮距离应为数字')
                checkCmd = False

        # 热键组合，内容不能为空
        if cmdType.value == CMD_HOTKEY:
            if cmd_value.ctype == 0:
                print(f'第{i + 1}行,D列: 热键内容不能为空')
                checkCmd = False

        # 时间粘贴，内容不能为空
        if cmdType.value == CMD_TIME:
            if cmd_value.ctype == 0:
                print(f'第{i + 1}行,D列: 时间操作不需要内容，但列不能为空')
                checkCmd = False

        # 系统命令，内容不能为空
        if cmdType.value == CMD_SYSTEM:
            if cmd_value.ctype == 0:
                print(f'第{i + 1}行,D列: 系统命令不能为空')
                checkCmd = False

        # 坐标操作检查
        if cmdType.value in [CMD_COORD_CLICK, CMD_COORD_DOUBLE]:
            # 检查B列(X坐标)和C列(Y坐标)
            x_val = row[1]  # B列: X坐标
            y_val = row[2]  # C列: Y坐标

            if x_val.ctype != 2 or y_val.ctype != 2:
                print(f'第{i + 1}行,B列或C列: 坐标应为数字')
                checkCmd = False

        # 混合模式检查
        if cmdType.value == CMD_FALLBACK_CLICK:
            if cmd_value.ctype != 1:  # 图片路径必须是字符串
                print(f'第{i + 1}行,D列: 图片路径应为字符串')
                checkCmd = False

            # 检查F列（备用坐标）是否存在
            if sheet1.ncols < 6:
                print(f'第{i + 1}行: 混合模式需要F列提供备用坐标')
                checkCmd = False
            else:
                fallback_value = row[5]  # F列: 备用坐标
                if fallback_value.ctype != 1:  # 必须是字符串
                    print(f'第{i + 1}行,F列: 备用坐标应为字符串')
                    checkCmd = False
                else:
                    # 验证坐标格式
                    coords = fallback_value.value.split(',')
                    if len(coords) != 2:
                        print(f'第{i + 1}行,F列: 坐标格式错误，应为 x,y')
                        checkCmd = False
                    else:
                        # 检查是否为数字
                        x_valid = coords[0].strip().lstrip('-+').isdigit()
                        y_valid = coords[1].strip().lstrip('-+').isdigit()
                        if not x_valid or not y_valid:
                            print(f'第{i + 1}行,F列: 坐标包含非数字字符')
                            checkCmd = False

    return checkCmd


# ====== 主任务函数 ======
def mainWork(sheet1):
    """
    执行Excel中的指令
    :param sheet1: Excel工作表对象
    """
    # 从第2行开始执行（跳过标题行）
    for i in range(1, sheet1.nrows):
        row = sheet1.row(i)
        cmdType = row[0].value
        cmd_value = row[3].value if row[3].ctype != 0 else ""  # D列: 内容

        # 计算重试次数 (E列: 重复次数)
        reTry = 1
        if len(row) > 4 and row[4].ctype == 2 and row[4].value != 0:
            reTry = int(row[4].value)

        # 1.0 左键单击（图片识别）
        if cmdType == CMD_CLICK:
            mouseClick(1, "left", cmd_value, reTry)
            print(f"单击左键: {cmd_value}")

        # 2.0 左键双击（图片识别）
        elif cmdType == CMD_DOUBLE_CLICK:
            mouseClick(2, "left", cmd_value, reTry)
            print(f"双击左键: {cmd_value}")

        # 3.0 右键单击（图片识别）
        elif cmdType == CMD_RIGHT_CLICK:
            mouseClick(1, "right", cmd_value, reTry)
            print(f"右键单击: {cmd_value}")

        # 4.0 输入文本
        elif cmdType == CMD_INPUT:
            pyperclip.copy(cmd_value)
            pyautogui.hotkey('ctrl', 'v')
            print(f"输入: {cmd_value}")
            time.sleep(0.5)

        # 5.0 等待时间
        elif cmdType == CMD_WAIT:
            time.sleep(cmd_value)
            print(f"等待: {cmd_value}秒")

        # 6.0 滚轮滑动
        elif cmdType == CMD_SCROLL:
            pyautogui.scroll(int(cmd_value))
            print(f"滚轮滑动: {int(cmd_value)}距离")

        # 7.0 热键组合
        elif cmdType == CMD_HOTKEY:
            hotkeyGroup(reTry, cmd_value)
            time.sleep(0.5)

        # 8.0 粘贴当前时间
        elif cmdType == CMD_TIME:
            localtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            pyperclip.copy(localtime)
            pyautogui.hotkey('ctrl', 'v')
            print(f"粘贴时间: {localtime}")
            time.sleep(0.5)

        # 9.0 系统命令
        elif cmdType == CMD_SYSTEM:
            os.system(cmd_value)
            print(f"执行系统命令: {cmd_value}")
            time.sleep(0.5)

        # 10.0 坐标单击
        elif cmdType == CMD_COORD_CLICK:
            x = int(row[1].value)  # B列: X坐标
            y = int(row[2].value)  # C列: Y坐标
            for _ in range(max(1, reTry)):
                pyautogui.moveTo(x, y, duration=0.2)
                pyautogui.click(button='left')
                print(f"坐标单击: ({x}, {y})")
                time.sleep(0.1)

        # 11.0 坐标双击
        elif cmdType == CMD_COORD_DOUBLE:
            x = int(row[1].value)  # B列: X坐标
            y = int(row[2].value)  # C列: Y坐标
            for _ in range(max(1, reTry)):
                pyautogui.moveTo(x, y, duration=0.2)
                pyautogui.doubleClick(button='left')
                print(f"坐标双击: ({x}, {y})")
                time.sleep(0.1)

        # 12.0 混合模式
        elif cmdType == CMD_FALLBACK_CLICK:
            # 获取备用坐标 (F列)
            fallback_coords = row[5].value if len(row) > 5 and row[5].ctype != 0 else None

            # 尝试图片识别
            location = pyautogui.locateCenterOnScreen(cmd_value, confidence=0.9)

            if location:
                for _ in range(max(1, reTry)):
                    pyautogui.click(location.x, location.y)
                    print(f"图片点击成功: {cmd_value} 位置: ({location.x}, {location.y})")
                    time.sleep(0.1)
            elif fallback_coords:
                try:
                    x, y = map(int, fallback_coords.split(','))
                    for _ in range(max(1, reTry)):
                        pyautogui.moveTo(x, y, duration=0.2)
                        pyautogui.click(button='left')
                        print(f"使用备用坐标: ({x}, {y})")
                        time.sleep(0.1)
                except:
                    print(f"备用坐标无效: {fallback_coords}")
            else:
                print(f"未找到图片且无备用坐标: {cmd_value}")


# ====== 主程序 ======
if __name__ == '__main__':
    while True:
        file = 'cmd.xlsx'
        try:
            # 打开Excel指令文件
            wb = xlrd.open_workbook(filename=file)
            sheet1 = wb.sheet_by_index(0)

            print('=' * 50)
            print('欢迎使用不高兴就喝水牌RPA~')
            print('大羽改良版_v250704 [Excel格式适配版]')
            print('=' * 50)

            # 避免多次循环导致的ctrl+v导入
            pyautogui.hotkey('esc')

            # 数据检查
            checkCmd = dataCheck(sheet1)

            if checkCmd:
                key = input('\n请选择功能:\n'
                            '1. 执行一次指令\n'
                            '2. 循环执行指定次数\n'
                            '3. 无限循环执行\n'
                            'c. 清理屏幕显示\n'
                            'r. 记录鼠标坐标\n'
                            '0. 退出程序\n'
                            '输入选项: ')

                # 坐标记录功能
                if key == 'r':
                    recorded = record_coordinates()
                    if recorded:
                        print("坐标已记录并复制到剪贴板")

                # 执行一次指令
                elif key == '1':
                    print("\n正在执行命令...")
                    mainWork(sheet1)
                    print("\n命令执行完成")
                    print("-" * 50)

                    # 循环执行指定次数
                elif key == '2':
                    times = input('请输入需要循环的次数: ')

                    try:
                        times = int(times)
                        if times <= 0:
                            print("循环次数必须大于0")
                        else:
                            for count in range(1, times + 1):
                                print(f"正在执行第 {count} 次命令")
                                mainWork(sheet1)
                                time.sleep(0.1)
                                print(f"已完成第 {count} 次命令")
                                print("-" * 50)
                    except ValueError:
                        print("请输入有效的数字")

                # 无限循环执行
                elif key == '3':
                    count = 0
                    print("开始无限循环（按Ctrl+C停止）")
                    try:
                        while True:
                            count += 1
                            print(f"正在执行第 {count} 次命令")
                            mainWork(sheet1)
                            time.sleep(0.1)
                            print(f"已完成第 {count} 次命令")
                            print("-" * 50)
                    except KeyboardInterrupt:
                        print("\n循环已停止")

                # 清理屏幕
                elif key == 'c':
                    os.system('cls')
                    print("屏幕已清理")

                # 退出程序
                elif key == '0':
                    print("正在清理缓存文件...")
                    os.system('@echo off & for /d %i in (%temp%\^_MEI*) do (rd /s /q "%i")>nul')
                    print("正在退出程序...")
                    break

                else:
                    print('输入有误，请重新选择!')
                    time.sleep(1)

        except FileNotFoundError:
            print(f"错误：找不到指令文件 {file}")
            print("请确保cmd.xlsx文件与脚本在同一目录")
            time.sleep(2)

        except Exception as e:
            print(f"发生错误: {str(e)}")
            print("程序将在5秒后重启...")
            time.sleep(5)