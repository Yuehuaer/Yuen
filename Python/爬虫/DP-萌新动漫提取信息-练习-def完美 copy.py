from DrissionPage import WebPage, ChromiumOptions
import random
import requests

# --- 1. 准备配置 (买零件) ---
co = ChromiumOptions()
co.set_paths(browser_path='auto') 
co.headless(True)# 设置无头模式, False 表示有界面, True 表示无界面
co.set_argument('--no-sandbox') 
co.set_user_agent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# --- 2. 实例化浏览器 (支锅) ---
# 这一行就是你刚才缺少的，没它就会报 NameError
page = WebPage(chromium_options=co)

# 3. 定义抓取标题
def zhuazhua(shuzi):
    url = f'https://www.mxdm.xyz/dongman/{shuzi}.html'
    # 此时函数就能认出上面的 page 了
    page.get(url)
    title = page.ele('.page-title').text
    return title # 返回标题

# 4.定义抓取简介
'''<div class="video-info-item video-info-content vod_content">
							高中生织田晶与同班同学一普通的“暗杀者”状的言行心生疑虑的晶，暗中隐藏自身存在并揭露其阴谋，...
                            <a href="javaScript:;" class="morecontent">展开</a></div>'''

def zhankai():#展开简介
	more_btn = page.ele('.morecontent')
	if more_btn:
		more_btn.click()
	# 获取全文
	quanwen = page.ele('xpath://div[@class="video-info-items"][span[contains(text(),"剧情")]]/div').text
	# 去掉“收起”和多余的空格换行
	return quanwen.replace('收起', '').strip() # 返回简介

def Bark(t, q):
    # Bark 推送功能

	bark_url = f"https://api.day.app/uFHWfqdqVF4oHCrp4tJHV/{t}/{q}"  # 替换为你的 Bark Key
	response = requests.get(bark_url)

def get_list():
    # 1. 访问日漫列表页
    url = 'https://www.mxdm.xyz/type/riman.html'
    page.get(url)
    
    # 2. 定位所有的动漫卡片链接
    # 观察发现它们都有 title 属性，且 href 包含 /dongman/
    # 我们用 css 选择器找到这些 <a> 标签
    links = page.eles('xpath://a[contains(@href, "/dongman/")]')
    
    id_list = []
    for link in links:
        href = link.attr('href')  # 拿到 "/dongman/9613.html"
        
        # 3. 提取数字逻辑
        # 把字符串按照 '/' 切开，拿最后一部分 '9613.html'
        # 再把 '.html' 替换为空
        if href:
            anime_id = href.split('/')[-1].replace('.html', '')
            # 为了防止重复抓到同样的 ID（有时候图片和标题各有一个链接）
            if anime_id not in id_list:
                id_list.append(anime_id)
    
    return id_list

# 5.测试抓取
if __name__ == '__main__':
	list = get_list()
	print(list)
	# shuzi = [
	# 	9375,
	# 	9513
	# ]

	# for i in shuzi:
	# 	t = zhuazhua(i)
	# 	q = zhankai()
	# 	print(f"标题: {t}")
	# 	print(f"简介: {q}")
	# 	print("="*50)
	# 	Bark(t, q)
	# 	# 核心保护：随机等 2 到 4 秒
	# 	page.wait(random.uniform(2, 4))

# 6. 关闭浏览器
page.quit()

