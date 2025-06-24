# 这个是一个控制浏览器的脚本，专门用来美团商家下载对账单.目前是窗口来的，具体功能未实现。当前时间2025.6.24

import tkinter as tk                                    #这是官方内置窗口组件库#
from tkinter import messagebox                          #这个是弹窗警告窗口
import json                                             #这是引用JSON文件
import os                                               #主要用于处理文件和目录、获取系统信息、执行系统命令等操作，以下为你详细介绍常见用途
from tkinter.ttk import Combobox                        #功能更强大、外观更现代的下拉选择框控件，用于创建带有下拉选项的输入框

a1 = tk.Tk()                                            #创建窗口
a1.title('美团对账单下载程序')                             #标题
a2 = a1.maxsize()                                       #获取当前屏幕尺寸
k,g = a2                                                #宽和高
a1.geometry(f'{int(k*0.3)}x{int(g*0.3)}')               #int转换，geometry设置窗口大小，英文字母小写x
a1.resizable(True,True)                    #自定义缩放宽高，true是可以，false是不可以
a1.iconbitmap('mei.ico')                                #放在相对路径下，不要选绝对路径

# 创建第二个菜单窗口
def t():
    t1 = tk.Toplevel()
    t1.title('我是二级窗口标题')
    t1.geometry('300x300+400+200')
    t1.resizable(False,False)
    t1.iconbitmap('mei.ico')
    tk.Label(t1, text='奢侈', font=('宋体', 11)).grid(row=1, column=1)    #二级窗口题目，移动位置
    t2 = tk.StringVar()
    t3 = ['北京', '上海','深圳']
    # 创建下拉列表(组合框)
    t4 = Combobox(t1, width=10,textvariable=t2, values=t3, font=('楷体',16)).place(x=10,y=20)
    t4.grid(row=2, column=1)


a3 = tk.Label(a1,text='此程序仅供用户个人学习、研究或非商业用途使用。\n因使用本程序产生的一切后果由用户自行承担，开发者不承担任何责任。',font=('宋体',13))    #标签组件，可以设置文字字体和颜色，字体背景颜色用不上，我没填写
a3.pack()                                               #生成标签组件
a3.place(x=20,y=15)                                     #移动标签组件位置

a2 = tk.Label(a1,text='账号',font=('宋体',11))    #标签组件，可以设置文字字体和颜色，字体背景颜色，用不上，我没填写
a2.pack()                                               #生成标签组件
a2.place(x=30,y=90)                                     #移动标签组件位置

a2 = tk.Label(a1,text='密码',font=('宋体',11))    #标签组件，可以设置文字字体和颜色，字体背景颜色，用不上，我没填写
a2.pack()                                               #生成标签组件
a2.place(x=30,y=140)                                    #移动标签组件位置

s1 = tk.StringVar()                                     #获取窗口文字
s1.set('请输入账号')                                      #提示文本
s2 = tk.StringVar()                                     #获取窗口文字
s2.set('请输入密码')                                      #提示文本


tk.Entry(a1,textvariable=s1,width=30,font=('宋体',13)).place(x=80,y=90)   #输入框，width尺寸
tk.Entry(a1,textvariable=s2,width=30,font=('宋体',13)).place(x=80,y=140)  #输入框，width尺寸

# 判断是否关闭窗口弹窗
def guan():
    d1 = messagebox.askokcancel('是否关闭','确定关闭吗?')
    if d1:
        a1.destroy()
    else:
        pass

#确定后获取字符，打印出来
def qd():
    print(s1.get())
    print(s2.get())
#注册后，能跳转到第二个框
def qx():
    a5 = tk.Tk()  # 创建窗口
    a5.title('美团对账单下载程序')  # 标题
    a5.geometry(f'{int(k * 0.3)}x{int(g * 0.3)}')  # int转换，geometry设置窗口大小，英文字母小写x
    a5.resizable(True, True)  # 自定义缩放宽高，true是可以，false是不可以
    a5.iconbitmap('mei.ico')  # 放在相对路径下，不要选绝对路径

tk.Button(a1,command=qd,text='确定',font=('宋体',13),width=13).place(x=70,y=190)  #按钮组件，command是点击就能确定获取上面输入框的字符
tk.Button(a1,command=qx,text='注册', font=('宋体', 13), width=13).place(x=220, y=190)            #按钮组件，command是点击就能确定获取上面输入框的字符

#设置guan这个函数，用到上方可以关闭窗口确认
a1.protocol('WM_DELETE_WINDOW', guan)

#创建主菜单
cai = tk.Menu(a1)
#创建下级菜单
xia = tk.Menu(cai, tearoff=0)
#绑定到主菜单,command可以指向下一个窗口
xia.add_command(label='帮助',command=t)
#设置菜单名
cai.add_cascade(label='设置',menu=xia)
#开启菜单栏
a1.config(menu=cai)





a1.mainloop()                                           #开启窗口'''



















