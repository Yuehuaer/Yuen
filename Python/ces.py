import pyautogui
import time
import xlrd
import openpyxl
import pyperclip
import os
import keyboard
import re

# ====== 操作类型常量（提高代码可读性） ======
CMD_CLICK = 1.0  # 左键单击
CMD_DOUBLE_CLICK = 2.0  # 左键双击
CMD_RIGHT_CLICK = 3.0  # 右键单击
CMD_INPUT = 4.0  # 输入文本
CMD_WAIT = 5.0  # 等待时间
CMD_SCROLL = 6.0  # 滚轮滑动
CMD_HOTKEY = 7.0  # 热键组合
CMD_TIME = 8.0  # 粘贴时间
CMD_SYSTEM = 9.0  # 系统命令
CMD_COORD_CLICK = 10.0  # 坐标单击
CMD_COORD_DOUBLE = 11.0  # 坐标双击
CMD_FALLBACK_CLICK = 12.0  # 混合模式


# ====== 定义鼠标事件函数 ======
def mouseClick(clickTimes, lOrR, img, reTry, timeout=15.0):
    """
    图片识别点击功能，带15秒超时
    :param clickTimes: 点击次数
    :param lOrR: 鼠标按钮（'left'或'right'）
    :param img: 图片路径
    :param reTry: 重试次数（1:单次, -1:无限, >1:指定次数）
    :param timeout: 最大重试时间（秒）
    :return: 是否成功点击
    """
    start_time = time.time()

    if reTry == 1:
        while time.time() - start_time < timeout:
            try:
                location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
                if location is not None:
                    pyautogui.click(location.x, location.y, clicks=clickTimes,
                                    interval=0.2, duration=0.2, button=lOrR)
                    return True
            except Exception as e:
                print(f"图片识别失败: {img} - {str(e)}")
            print(f"未找到图片 {img}, 0.1秒后重试")
            time.sleep(0.1)
        print(f"超时：{timeout}秒内未找到图片 {img}，继续下一步")
        return False

    elif reTry == -1:
        while time.time() - start_time < timeout:
            try:
                location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
                if location is not None:
                    pyautogui.click(location.x, location.y, clicks=clickTimes,
                                    interval=0.2, duration=0.2, button=lOrR)
                    return True
            except Exception as e:
                print(f"图片识别失败: {img} - {str(e)}")
            time.sleep(0.1)
        print(f"超时：{timeout}秒内未找到图片 {img}，继续下一步")
        return False

    elif reTry > 1:
        i = 1
        while i < reTry + 1 and time.time() - start_time < timeout:
            try:
                location = pyautogui.locateCenterOnScreen(img, confidence=0.9)
                if location is not None:
                    pyautogui.click(location.x, location.y, clicks=clickTimes,
                                    interval=0.2, duration=0.2, button=lOrR)
                    print("重复")
                    i += 1
            except Exception as e:
                print(f"图片识别失败: {img} - {str(e)}")
            time.sleep(0.1)
        if i < reTry + 1:
            print(f"超时：{timeout}秒内未完成所有重试，图片 {img}，继续下一步")
            return False
        return True


# ====== 定义热键事件函数 ======
def hotkey_get(hk_g_inputValue):
    """
    处理热键组合或文本输入
    :param hk_g_inputValue: 热键组合（如'ctrl,c'）或文本内容
    """
    try:
        newinput = hk_g_inputValue.split(',')
        pyautogui.hotkey(*tuple(newinput))
    except:
        pyperclip.copy(str(hk_g_inputValue))
        pyautogui.hotkey('ctrl', 'v')


def hotkeyGroup(reTry, hkg_inputValue):
    """
    执行热键操作
    :param reTry: 重试次数
    :param hkg_inputValue: 热键值
    """
    if reTry == 1:
        hotkey_get(hkg_inputValue)
        print("执行了：", hkg_inputValue)
        time.sleep(0.1)
    elif reTry == -1:
        while True:
            hotkey_get(hkg_inputValue)
            print("执行了：", hkg_inputValue)
            time.sleep(0.1)
    elif reTry > 1:
        i = 1
        while i < reTry + 1:
            hotkey_get(hkg_inputValue)
            print("执行了：", hkg_inputValue)
            i += 1
            time.sleep(0.1)


# ====== 坐标工具函数 ======
def parse_coordinates(coord_str):
    """
    解析坐标字符串，支持绝对坐标和相对坐标
    :param coord_str: 坐标字符串（如"300,400"或"+100,-50"）
    :return: (x, y) 坐标元组
    """
    try:
        # 转换为字符串并清理
        coord_str = str(coord_str).strip()
        coord_str = re.sub(r'\s+', '', coord_str)  # 移除所有空白字符
        if not coord_str:
            raise ValueError("坐标字符串为空")

        # 处理 Excel 自动转换的数字（如 265539.0 -> "265,539"）
        if isinstance(coord_str, (int, float)) or coord_str.replace('.', '').isdigit():
            coord_str = f"{int(float(coord_str)):,}"

        if coord_str.startswith(('+', '-')):
            current_x, current_y = pyautogui.position()
            if ',' in coord_str:
                x_part, y_part = coord_str.split(',')
                x_offset = int(x_part)
                y_offset = int(y_part)
                return current_x + x_offset, current_y + y_offset
        else:
            if not re.match(r'^-?\d+,-?\d+$', coord_str):
                raise ValueError("坐标格式错误，应为 x,y")
            x, y = map(int, coord_str.split(','))
            return x, y
    except Exception as e:
        print(f"坐标解析错误: {coord_str} - {str(e)}")
        return None, None


def record_coordinates():
    """
    坐标记录工具 - 实时显示鼠标位置，按空格记录，ESC退出
    """
    print("\n=== 坐标记录模式 ===")
    print("操作说明:")
    print("1. 移动鼠标到需要记录的位置")
    print("2. 按空格键记录当前位置")
    print("3. 按ESC键退出记录模式")
    print("4. 粘贴到 Excel 时：")
    print("   - 选中目标单元格（如 B2）")
    print("   - 右键 -> 格式 -> 文本，确保单元格格式为文本")
    print("   - 粘贴后确保每组坐标占单独单元格（如 265,539）")
    print("   - 如果 Excel 自动转为货币格式，重新输入坐标并确认格式为文本")
    print("==================")

    recorded_points = []

    try:
        while True:
            x, y = pyautogui.position()
            print(f"\r当前鼠标位置: ({x}, {y})", end="")

            if keyboard.is_pressed('space'):
                recorded_points.append((x, y))
                print(f"\n已记录坐标 {len(recorded_points)}: ({x}, {y})")
                while keyboard.is_pressed('space'):
                    time.sleep(0.01)

            if keyboard.is_pressed('esc'):
                print("\n退出记录模式")
                break

            time.sleep(0.1)

    except KeyboardInterrupt:
        print("\n记录模式被中断")

    if recorded_points:
        coord_str = "\n".join([f"{x},{y}" for x, y in recorded_points])
        pyperclip.copy(coord_str)
        # 保存到临时文件便于检查
        with open('recorded_coordinates.txt', 'w') as f:
            f.write(coord_str)
        print(f"\n已复制{len(recorded_points)}个坐标到剪贴板，并保存到 recorded_coordinates.txt")
        print(coord_str)
        print("\n粘贴说明：")
        print("1. 打开 Excel，选中目标单元格（如 B2）")
        print("2. 右键 -> 格式 -> 文本，确保单元格格式为文本")
        print("3. 粘贴后，每组坐标应单独占一单元格（如 265,539）")
        print("4. 如果 Excel 自动转为货币格式，重新输入坐标并确认格式为文本")
        print("5. 检查 recorded_coordinates.txt 以确认坐标格式")
        print("提示：在Excel中创建坐标操作指令：")
        print("| 操作类型 | 内容       | 重试次数 |")
        print("|----------|------------|----------|")
        for x, y in recorded_points:
            print(f"| 10.0     | {x},{y}    | 1        |")

    return recorded_points


# ====== 加载 Excel 文件 ======
def load_workbook(file):
    """
    加载 Excel 文件，支持 .xls 和 .xlsx 格式
    :param file: Excel 文件路径
    :return: 工作表对象
    """
    ext = os.path.splitext(file)[1].lower()
    try:
        if ext == '.xls':
            wb = xlrd.open_workbook(filename=file)
            return wb.sheet_by_index(0)
        elif ext == '.xlsx':
            wb = openpyxl.load_workbook(file)
            return wb.active
        else:
            raise ValueError("不支持的文件格式，仅支持 .xls 和 .xlsx")
    except FileNotFoundError:
        raise FileNotFoundError(f"找不到文件: {file}")
    except Exception as e:
        raise Exception(f"加载 Excel 文件失败: {str(e)}")


# ====== 数据检查函数 ======
def dataCheck(sheet):
    """
    检查 Excel 指令表数据有效性
    """
    checkCmd = True

    if isinstance(sheet, xlrd.sheet.Sheet):
        nrows = sheet.nrows
        ncols = sheet.ncols
    else:
        nrows = sheet.max_row
        ncols = sheet.max_column

    if nrows < 2:
        print("错误：指令表中没有数据")
        return False

    i = 1
    while i < nrows:
        if isinstance(sheet, xlrd.sheet.Sheet):
            row = sheet.row(i)
            cmdType = row[0].value
            cmdValue = row[1]
            reTry = row[2].value if len(row) > 2 else 1
            fallback_value = row[3] if len(row) > 3 else None
        else:
            row = sheet[i + 1]
            cmdType = row[0].value
            cmdValue = row[1]
            reTry = row[2].value if row[2] else 1
            fallback_value = row[3] if len(row) > 3 else None

        valid_cmds = [
            CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK,
            CMD_INPUT, CMD_WAIT, CMD_SCROLL, CMD_HOTKEY,
            CMD_TIME, CMD_SYSTEM, CMD_COORD_CLICK,
            CMD_COORD_DOUBLE, CMD_FALLBACK_CLICK
        ]

        if not isinstance(cmdType, (int, float)) or cmdType not in valid_cmds:
            print(f'第{i + 1}行,第1列: 无效的操作类型: {cmdType}')
            checkCmd = False

        if cmdType in [CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK]:
            if not isinstance(cmdValue.value, str) or not cmdValue.value.endswith('.png'):
                print(f'第{i + 1}行,第2列: 图片路径应为字符串且以 .png 结尾: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_INPUT:
            if not cmdValue.value:
                print(f'第{i + 1}行,第2列: 输入内容不能为空: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_WAIT:
            if not isinstance(cmdValue.value, (int, float)):
                print(f'第{i + 1}行,第2列: 等待时间应为数字: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_SCROLL:
            if not isinstance(cmdValue.value, (int, float)):
                print(f'第{i + 1}行,第2列: 滚轮距离应为数字: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_HOTKEY:
            if not cmdValue.value:
                print(f'第{i + 1}行,第2列: 热键内容不能为空: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_TIME:
            if not cmdValue.value:
                print(f'第{i + 1}行,第2列: 时间操作不需要内容，但列不能为空: {cmdValue.value}')
                checkCmd = False

        if cmdType == CMD_SYSTEM:
            if not cmdValue.value:
                print(f'第{i + 1}行,第2列: 系统命令不能为空: {cmdValue.value}')
                checkCmd = False

        if cmdType in [CMD_COORD_CLICK, CMD_COORD_DOUBLE]:
            coord_str = str(cmdValue.value).strip()
            coord_str = re.sub(r'\s+', '', coord_str)
            if isinstance(cmdValue.value, (int, float)):
                coord_str = f"{int(float(cmdValue.value)):,}"
            if not re.match(r'^-?\d+,-?\d+$', coord_str):
                print(f'第{i + 1}行,第2列: 坐标格式错误，应为 x,y（如 265,539）: {coord_str}')
                print("请确保单元格格式为‘文本’，重新输入坐标")
                checkCmd = False

        if cmdType == CMD_FALLBACK_CLICK:
            if not isinstance(cmdValue.value, str) or not cmdValue.value.endswith('.png'):
                print(f'第{i + 1}行,第2列: 图片路径应为字符串且以 .png 结尾: {cmdValue.value}')
                checkCmd = False
            if ncols < 4 or not fallback_value or not isinstance(fallback_value.value, str):
                print(
                    f'第{i + 1}行,第4列: 混合模式需要有效的备用坐标: {fallback_value.value if fallback_value else None}')
                checkCmd = False
            else:
                coord_str = str(fallback_value.value).strip()
                coord_str = re.sub(r'\s+', '', coord_str)
                if isinstance(fallback_value.value, (int, float)):
                    coord_str = f"{int(float(fallback_value.value)):,}"
                if not re.match(r'^-?\d+,-?\d+$', coord_str):
                    print(f'第{i + 1}行,第4列: 坐标格式错误，应为 x,y（如 265,539）: {coord_str}')
                    print("请确保单元格格式为‘文本’，重新输入坐标")
                    checkCmd = False

        i += 1

    return checkCmd


# ====== 主任务函数 ======
def mainWork(sheet):
    """
    执行 Excel 中的指令
    """
    if isinstance(sheet, xlrd.sheet.Sheet):
        nrows = sheet.nrows
        ncols = sheet.ncols
    else:
        nrows = sheet.max_row
        ncols = sheet.max_column

    i = 1
    while i < nrows:
        if isinstance(sheet, xlrd.sheet.Sheet):
            row = sheet.row(i)
            cmdType = row[0].value
            cmdValue = row[1].value
            reTry = row[2].value if len(row) > 2 else 1
            fallback_value = row[3].value if len(row) > 3 else None
        else:
            row = sheet[i + 1]
            cmdType = row[0].value
            cmdValue = row[1].value
            reTry = row[2].value if row[2] else 1
            fallback_value = row[3].value if len(row) > 3 else None

        if cmdType == CMD_CLICK:
            mouseClick(1, "left", cmdValue, reTry, timeout=15.0)
            print(f"单击左键: {cmdValue}")

        elif cmdType == CMD_DOUBLE_CLICK:
            mouseClick(2, "left", cmdValue, reTry, timeout=15.0)
            print(f"双击左键: {cmdValue}")

        elif cmdType == CMD_RIGHT_CLICK:
            mouseClick(1, "right", cmdValue, reTry, timeout=15.0)
            print(f"右键单击: {cmdValue}")

        elif cmdType == CMD_INPUT:
            pyperclip.copy(str(cmdValue))
            pyautogui.hotkey('ctrl', 'v')
            print(f"输入: {cmdValue}")
            time.sleep(0.5)

        elif cmdType == CMD_WAIT:
            time.sleep(cmdValue)
            print(f"等待: {cmdValue}秒")

        elif cmdType == CMD_SCROLL:
            pyautogui.scroll(int(cmdValue))
            print(f"滚轮滑动: {int(cmdValue)}距离")

        elif cmdType == CMD_HOTKEY:
            hotkeyGroup(reTry, cmdValue)
            time.sleep(0.5)

        elif cmdType == CMD_TIME:
            localtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            pyperclip.copy(localtime)
            pyautogui.hotkey('ctrl', 'v')
            print(f"粘贴时间: {localtime}")
            time.sleep(0.5)

        elif cmdType == CMD_SYSTEM:
            os.system(str(cmdValue))
            print(f"执行系统命令: {cmdValue}")
            time.sleep(0.5)

        elif cmdType == CMD_COORD_CLICK:
            x, y = parse_coordinates(cmdValue)
            if x is not None and y is not None:
                for _ in range(max(1, int(reTry))):
                    pyautogui.moveTo(x, y, duration=0.2)
                    pyautogui.click(button='left')
                    print(f"坐标单击: ({x}, {y})")
                    time.sleep(0.1)
            else:
                print(f"跳过无效坐标点击: {cmdValue}")

        elif cmdType == CMD_COORD_DOUBLE:
            x, y = parse_coordinates(cmdValue)
            if x is not None and y is not None:
                for _ in range(max(1, int(reTry))):
                    pyautogui.moveTo(x, y, duration=0.2)
                    pyautogui.doubleClick(button='left')
                    print(f"坐标双击: ({x}, {y})")
                    time.sleep(0.1)
            else:
                print(f"跳过无效坐标双击: {cmdValue}")

        elif cmdType == CMD_FALLBACK_CLICK:
            try:
                location = pyautogui.locateCenterOnScreen(cmdValue, confidence=0.9)
                if location:
                    for _ in range(max(1, int(reTry))):
                        pyautogui.click(location.x, location.y)
                        print(f"图片点击成功: {cmdValue} 位置: ({location.x}, {location.y})")
                        time.sleep(0.1)
                elif fallback_value:
                    x, y = parse_coordinates(fallback_value)
                    if x is not None and y is not None:
                        for _ in range(max(1, int(reTry))):
                            pyautogui.moveTo(x, y, duration=0.2)
                            pyautogui.click(button='left')
                            print(f"使用备用坐标: ({x}, {y})")
                            time.sleep(0.1)
                    else:
                        print(f"备用坐标无效: {fallback_value}")
                else:
                    print(f"未找到图片且无备用坐标: {cmdValue}")
            except Exception as e:
                print(f"图片识别失败: {cmdValue} - {str(e)}")
                if fallback_value:
                    x, y = parse_coordinates(fallback_value)
                    if x is not None and y is not None:
                        for _ in range(max(1, int(reTry))):
                            pyautogui.moveTo(x, y, duration=0.2)
                            pyautogui.click(button='left')
                            print(f"使用备用坐标: ({x}, {y})")
                            time.sleep(0.1)
                    else:
                        print(f"备用坐标无效: {fallback_value}")
                else:
                    print(f"未找到图片且无备用坐标: {cmdValue}")

        i += 1


# ====== 主程序 ======
if __name__ == '__main__':
    pyautogui.FAILSAFE = True  # 鼠标移到左上角可紧急停止
    while True:
        file = 'cmd.xls'  # 支持 .xlsx 和 .xls
        try:
            sheet = load_workbook(file)
            print('=' * 50)
            print('欢迎使用不高兴就喝水牌RPA~')
            print('大羽改良版_v250724 [坐标增强版]')
            print('=' * 50)

            pyautogui.hotkey('esc')
            checkCmd = dataCheck(sheet)

            if checkCmd:
                key = input('\n请选择功能:\n'
                            '1. 执行一次指令\n'
                            '2. 循环执行指定次数\n'
                            '3. 无限循环执行（按ESC停止）\n'
                            'c. 清理屏幕显示\n'
                            'r. 记录鼠标坐标\n'
                            '0. 退出程序\n'
                            '输入选项: ')

                if key == 'r':
                    record_coordinates()

                elif key == '1':
                    print("\n正在执行第1次命令")
                    mainWork(sheet)
                    print("\n已完成第1次命令")
                    print("-" * 50)

                elif key == '2':
                    try:
                        times = int(input('请输入需要循环的次数: '))
                        if times <= 0:
                            print("循环次数必须大于0")
                        else:
                            count = 0
                            while count < times:
                                count += 1
                                print(f"正在执行第 {count} 次命令")
                                mainWork(sheet)
                                time.sleep(0.1)
                                print(f"已完成第 {count} 次命令")
                                print("-" * 50)
                    except ValueError:
                        print("请输入有效的数字")

                elif key == '3':
                    count = 0
                    print("开始无限循环（按ESC停止）")
                    while not keyboard.is_pressed('esc'):
                        count += 1
                        print(f"正在执行第 {count} 次命令")
                        mainWork(sheet)
                        time.sleep(0.1)
                        print(f"已完成第 {count} 次命令")
                        print("-" * 50)
                    print("\n循环已停止")

                elif key == 'c':
                    os.system('cls' if os.name == 'nt' else 'clear')
                    print("屏幕已清理")

                elif key == '0':
                    print("正在清理缓存文件...")
                    os.system('cls' if os.name == 'nt' else 'clear')
                    print("正在退出程序...")
                    break

                else:
                    print('输入有误，请重新选择!')
                    time.sleep(1)

        except Exception as e:
            print(f"错误: {str(e)}")
            print("程序将在5秒后重启...")
            time.sleep(5)