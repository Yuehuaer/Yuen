# 这个是一个控制电脑鼠标键盘移动的脚本，专门用来缴纳社保以及社保下载对账单

import pyautogui as pa              #运用pyautogui库（操控鼠标键盘）,并起名pa
import time                         #运用time库（控制时间）
import pyperclip                    #运用粘贴板库（粘贴）
# import pillow                     #截取当前屏幕图片库



# x,y = pa.size()                                 #获取当前电脑屏幕尺寸
# pa.alert(f'当前屏幕尺寸为{x,y},\n请确认是否符合“1920*1080”','社保自动程序','确认')   #窗口程序，第一个位置传，内容，第二个位置传，标题，第三个位置传，按钮
#
#
g1 = ('91440300MA5FLU3T27')
m1 = ('Wym112233')
z1 = ('WYM')
t1 = ('2025-06')
t2 = (f'{z1}{t1}')


'''第一步，打开社保'''
time.sleep(1)                                 #延迟时间
pa.click(37,838,clicks=2,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
'''第二步，选择公司'''
time.sleep(15)                                 #延迟时间
pa.click(855,471,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
'''第二步，输入公司'''
time.sleep(3)
pa.write(g1)                                                        #简单输入指定文字，不能中文,可以增加间隔时间
pa.click(669,563,clicks=2,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(3)                                 #延迟时间
pa.write(m1)    #简单输入指定文字，不能中文,可Ys25806978以增加间隔时间
time.sleep(1)
pa.click(1138,784,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(30)

'''第二步，进入了系统，关闭确定办理业务单位'''
time.sleep(3)                                 #延迟时间
pa.click(954,703,clicks=2,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）


time.sleep(3)                                 #延迟时间
pa.click(1392,228,clicks=2,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）

time.sleep(3)                                 #延迟时间
pa.click(1276,326,clicks=2,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(3)
pa.click(959,603,clicks=2,duration=0.5)

'''第三步，查询统计'''
time.sleep(2)                                 #延迟时间
pa.click(69,433,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(100,555,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）


'''第四步，查询下载'''
time.sleep(3)                                 #延迟时间
pa.click(509,410,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(922,694,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(5)                                 #延迟时间
pa.click(960,598,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(2)                                 #延迟时间
pa.click(995,700,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）

'''填写所属期'''
time.sleep(2)                                 #延迟时间
pa.click(411,211,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(436,211,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(411,211,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)
pa.write(t1)
pa.click(517,209,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(565,212,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(517,209,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)
pa.write(t1)
'''删除指定日期'''
time.sleep(1)
pa.click(434,307,clicks=2,interval=1)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(566,306,clicks=2,interval=1)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间

pa.click(1309,210,clicks=1,duration=0.3)        #指定地点，点击次数（可填写），延缓移动时间（几秒）

time.sleep(2)                                 #延迟时间
pa.click(246,163,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)                                 #延迟时间
pa.click(732,353,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
pa.write(t2)
time.sleep(1)                                 #延迟时间
pa.click(1172,581,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(3)
pa.click(959,599,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）


'''关闭系统'''
pa.click(1906,11,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(1)
pa.click(1004,595,clicks=1,duration=0.5)        #指定地点，点击次数（可填写），延缓移动时间（几秒）
time.sleep(3)
pa.alert('-----社保对账单------\n----------------------\n-----下载完毕--------\n----------------------\n---本程序运行结束---')

