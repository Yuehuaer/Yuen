import pyautogui
import time
import xlrd
import pyperclip
import os

# ====== 操作类型常量（提高代码可读性） ======
CMD_CLICK = 1.0          # 左键单击
CMD_DOUBLE_CLICK = 2.0   # 左键双击
CMD_RIGHT_CLICK = 3.0    # 右键单击
CMD_INPUT = 4.0          # 输入文本
CMD_WAIT = 5.0           # 等待时间
CMD_SCROLL = 6.0         # 滚轮滑动
CMD_HOTKEY = 7.0         # 热键组合
CMD_TIME = 8.0           # 粘贴时间
CMD_SYSTEM = 9.0         # 系统命令
CMD_COORD_CLICK = 10.0   # 坐标单击（新功能）
CMD_COORD_DOUBLE = 11.0  # 坐标双击（新功能）
CMD_FALLBACK_CLICK = 12.0 # 混合模式（新功能）

# ====== 定义鼠标事件函数 ======
def mouseClick(clickTimes, lOrR, img, reTry):
    """
    图片识别点击功能
    :param clickTimes: 点击次数
    :param lOrR: 鼠标按钮（'left'或'right'）
    :param img: 图片路径
    :param reTry: 重试次数（1:单次, -1:无限, >1:指定次数）
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
    :param hk_g_inputValue: 热键组合（如'ctrl,c'）或文本内容
    """
    try:
        newinput = hk_g_inputValue.split(',')
        pyautogui.hotkey(*tuple(newinput))
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

# ====== 新增：坐标工具函数 ======
def parse_coordinates(coord_str):
    """
    解析坐标字符串，支持绝对坐标和相对坐标
    :param coord_str: 坐标字符串（如"300,400"或"+100,-50"）
    :return: (x, y) 坐标元组
    """
    try:
        # 处理相对坐标（如"+100,-50"）
        if coord_str.startswith(('+', '-')):
            current_x, current_y = pyautogui.position()
            if ',' in coord_str:
                x_part, y_part = coord_str.split(',')
                x_offset = int(x_part)
                y_offset = int(y_part)
                return current_x + x_offset, current_y + y_offset
        
        # 处理绝对坐标（如"300,400"）
        else:
            x, y = map(int, coord_str.split(','))
            return x, y
    except Exception as e:
        print(f"坐标解析错误: {coord_str} - {str(e)}")
        return None, None

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
        print("| 操作类型 | 内容       | 重试次数 |")
        print("|----------|------------|----------|")
        for x, y in recorded_points:
            print(f"| 10.0     | {x},{y}    | 1        |")
    
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
    
    # 每行数据检查
    i = 1
    while i < sheet1.nrows:
        # 第1列 操作类型检查
        cmdType = sheet1.row(i)[0]
        valid_cmds = [
            CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK, 
            CMD_INPUT, CMD_WAIT, CMD_SCROLL, CMD_HOTKEY, 
            CMD_TIME, CMD_SYSTEM, CMD_COORD_CLICK, 
            CMD_COORD_DOUBLE, CMD_FALLBACK_CLICK
        ]
        
        if cmdType.ctype != 2 or cmdType.value not in valid_cmds:
            print(f'第{i+1}行,第1列: 无效的操作类型')
            checkCmd = False
        
        # 第2列 内容检查
        cmdValue = sheet1.row(i)[1]
        
        # 图片点击类型指令，内容必须为字符串
        if cmdType.value in [CMD_CLICK, CMD_DOUBLE_CLICK, CMD_RIGHT_CLICK]:
            if cmdValue.ctype != 1:
                print(f'第{i+1}行,第2列: 图片路径应为字符串')
                checkCmd = False
        
        # 输入类型，内容不能为空
        if cmdType.value == CMD_INPUT:
            if cmdValue.ctype == 0:
                print(f'第{i+1}行,第2列: 输入内容不能为空')
                checkCmd = False
        
        # 等待类型，内容必须为数字
        if cmdType.value == CMD_WAIT:
            if cmdValue.ctype != 2:
                print(f'第{i+1}行,第2列: 等待时间应为数字')
                checkCmd = False
        
        # 滚轮事件，内容必须为数字
        if cmdType.value == CMD_SCROLL:
            if cmdValue.ctype != 2:
                print(f'第{i+1}行,第2列: 滚轮距离应为数字')
                checkCmd = False
        
        # 热键组合，内容不能为空
        if cmdType.value == CMD_HOTKEY:
            if cmdValue.ctype == 0:
                print(f'第{i+1}行,第2列: 热键内容不能为空')
                checkCmd = False
        
        # 时间粘贴，内容不能为空（但实际未使用）
        if cmdType.value == CMD_TIME:
            if cmdValue.ctype == 0:
                print(f'第{i+1}行,第2列: 时间操作不需要内容，但列不能为空')
                checkCmd = False
        
        # 系统命令，内容不能为空
        if cmdType.value == CMD_SYSTEM:
            if cmdValue.ctype == 0:
                print(f'第{i+1}行,第2列: 系统命令不能为空')
                checkCmd = False
        
        # 坐标操作检查
        if cmdType.value in [CMD_COORD_CLICK, CMD_COORD_DOUBLE]:
            if cmdValue.ctype != 1:  # 必须是字符串
                print(f'第{i+1}行,第2列: 坐标应为字符串格式')
                checkCmd = False
            else:
                # 验证坐标格式
                coords = cmdValue.value.split(',')
                if len(coords) != 2:
                    print(f'第{i+1}行,第2列: 坐标格式错误，应为 x,y')
                    checkCmd = False
                else:
                    # 检查是否为数字（支持正负号）
                    x_valid = coords[0].strip().lstrip('-+').isdigit()
                    y_valid = coords[1].strip().lstrip('-+').isdigit()
                    if not x_valid or not y_valid:
                        print(f'第{i+1}行,第2列: 坐标包含非数字字符')
                        checkCmd = False
        
        # 混合模式检查
        if cmdType.value == CMD_FALLBACK_CLICK:
            if cmdValue.ctype != 1:  # 图片路径必须是字符串
                print(f'第{i+1}行,第2列: 图片路径应为字符串')
                checkCmd = False
            
            # 检查第4列（备用坐标）是否存在
            if sheet1.ncols < 4:
                print(f'第{i+1}行: 混合模式需要第4列提供备用坐标')
                checkCmd = False
            else:
                fallback_value = sheet1.row(i)[3]
                if fallback_value.ctype != 1:  # 必须是字符串
                    print(f'第{i+1}行,第4列: 备用坐标应为字符串')
                    checkCmd = False
                else:
                    # 验证坐标格式
                    coords = fallback_value.value.split(',')
                    if len(coords) != 2:
                        print(f'第{i+1}行,第4列: 坐标格式错误，应为 x,y')
                        checkCmd = False
                    else:
                        # 检查是否为数字
                        x_valid = coords[0].strip().lstrip('-+').isdigit()
                        y_valid = coords[1].strip().lstrip('-+').isdigit()
                        if not x_valid or not y_valid:
                            print(f'第{i+1}行,第4列: 坐标包含非数字字符')
                            checkCmd = False
        
        i += 1
    
    return checkCmd

# ====== 主任务函数 ======
def mainWork(sheet1):
    """
    执行Excel中的指令
    :param sheet1: Excel工作表对象
    """
    i = 1
    while i < sheet1.nrows:
        # 取本行指令的操作类型
        cmdType = sheet1.row(i)[0]
        cmdValue = sheet1.row(i)[1].value
        
        # 计算重试次数
        reTry = 1
        if sheet1.row(i)[2].ctype == 2 and sheet1.row(i)[2].value != 0:
            reTry = sheet1.row(i)[2].value
        
        # 1.0 左键单击（图片识别）
        if cmdType.value == CMD_CLICK:
            img = cmdValue
            mouseClick(1, "left", img, reTry)
            print(f"单击左键: {img}")
        
        # 2.0 左键双击（图片识别）
        elif cmdType.value == CMD_DOUBLE_CLICK:
            img = cmdValue
            mouseClick(2, "left", img, reTry)
            print(f"双击左键: {img}")
        
        # 3.0 右键单击（图片识别）
        elif cmdType.value == CMD_RIGHT_CLICK:
            img = cmdValue
            mouseClick(1, "right", img, reTry)
            print(f"右键单击: {img}")
        
        # 4.0 输入文本
        elif cmdType.value == CMD_INPUT:
            pyperclip.copy(cmdValue)
            pyautogui.hotkey('ctrl', 'v')
            print(f"输入: {cmdValue}")
            time.sleep(0.5)
        
        # 5.0 等待时间
        elif cmdType.value == CMD_WAIT:
            time.sleep(cmdValue)
            print(f"等待: {cmdValue}秒")
        
        # 6.0 滚轮滑动
        elif cmdType.value == CMD_SCROLL:
            pyautogui.scroll(int(cmdValue))
            print(f"滚轮滑动: {int(cmdValue)}距离")
        
        # 7.0 热键组合
        elif cmdType.value == CMD_HOTKEY:
            hotkeyGroup(reTry, cmdValue)
            time.sleep(0.5)
        
        # 8.0 粘贴当前时间
        elif cmdType.value == CMD_TIME:
            localtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            pyperclip.copy(localtime)
            pyautogui.hotkey('ctrl', 'v')
            print(f"粘贴时间: {localtime}")
            time.sleep(0.5)
        
        # 9.0 系统命令
        elif cmdType.value == CMD_SYSTEM:
            os.system(cmdValue)
            print(f"执行系统命令: {cmdValue}")
            time.sleep(0.5)
        
        # 10.0 坐标单击（新功能）
        elif cmdType.value == CMD_COORD_CLICK:
            x, y = parse_coordinates(cmdValue)
            if x is not None and y is not None:
                for _ in range(max(1, reTry)):
                    pyautogui.moveTo(x, y, duration=0.2)
                    pyautogui.click(button='left')
                    print(f"坐标单击: ({x}, {y})")
                    time.sleep(0.1)
        
        # 11.0 坐标双击（新功能）
        elif cmdType.value == CMD_COORD_DOUBLE:
            x, y = parse_coordinates(cmdValue)
            if x is not None and y is not None:
                for _ in range(max(1, reTry)):
                    pyautogui.moveTo(x, y, duration=0.2)
                    pyautogui.doubleClick(button='left')
                    print(f"坐标双击: ({x}, {y})")
                    time.sleep(0.1)
        
        # 12.0 混合模式（新功能）
        elif cmdType.value == CMD_FALLBACK_CLICK:
            img_path = cmdValue
            # 获取第4列的备用坐标
            fallback_coords = sheet1.row(i)[3].value if sheet1.ncols > 3 else None
            
            # 尝试图片识别
            location = pyautogui.locateCenterOnScreen(img_path, confidence=0.9)
            
            if location:
                for _ in range(max(1, reTry)):
                    pyautogui.click(location.x, location.y)
                    print(f"图片点击成功: {img_path} 位置: ({location.x}, {location.y})")
                    time.sleep(0.1)
            elif fallback_coords:
                x, y = parse_coordinates(fallback_coords)
                if x is not None and y is not None:
                    for _ in range(max(1, reTry)):
                        pyautogui.moveTo(x, y, duration=0.2)
                        pyautogui.click(button='left')
                        print(f"使用备用坐标: ({x}, {y})")
                        time.sleep(0.1)
                else:
                    print(f"备用坐标无效: {fallback_coords}")
            else:
                print(f"未找到图片且无备用坐标: {img_path}")
        
        i += 1

# ====== 主程序 ======
if __name__ == '__main__':
    while True:
        file = 'cmd.xls'
        try:
            # 打开Excel指令文件
            wb = xlrd.open_workbook(filename=file)
            sheet1 = wb.sheet_by_index(0)
            
            print('=' * 50)
            print('欢迎使用不高兴就喝水牌RPA~')
            print('大羽改良版_v250704 [坐标增强版]')
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
                    print("\n正在执行第1次命令")  
                    mainWork(sheet1)
                    print("\n已完成第1次命令")  
                    print("-" * 50)  
                
                # 循环执行指定次数
                elif key == '2':
                    print("")
                    count = 0
                    times = input('请输入需要循环的次数: ')
                    
                    try:
                        times = int(times)
                        if times <= 0:
                            print("循环次数必须大于0")
                        else:
                            while count < times:
                                count += 1 
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
            print("请确保cmd.xls文件与脚本在同一目录")
            time.sleep(2)
        
        except Exception as e:
            print(f"发生错误: {str(e)}")
            print("程序将在5秒后重启...")
            time.sleep(5)