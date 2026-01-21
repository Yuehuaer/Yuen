from DrissionPage import WebPage, ChromiumOptions

# --- 1. 添加配置，防止 404 ---
co = ChromiumOptions()
# 自动寻找系统中安装的 Chrome 浏览器
co.set_paths(browser_path='auto') 
# 关键：让浏览器看起来更像真人（避开自动化特征检测）
co.set_argument('--no-sandbox') 
co.set_user_agent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# 额外测试增加列表
list = [
	9510, 9509, 9508
]

# --- 2. 启动并访问 ---
page = WebPage(chromium_options=co)

# 写入txt文件
f = open('anime_data.txt', 'a', encoding='utf-8')


for shuzi in list:
	# 1. 组合出链接
	url = f'https://www.mxdm.xyz/dongman/{shuzi}.html'
    
    # 2. 访问它
	page.get(url)

	# 💡 技巧：如果还是 404，在访问后加一个微小的等待，让服务器反应一下
	page.wait(1.5)

	# 2. 定位 class 为 page-title 的 h1 标签并取文字
	'''<h1 class="page-title">能帮我弄干净吗？</h1>'''
	title = page.ele('.page-title').text

	print(f"标题: {title}")

	# 3.定位其他信息
	'''<h2 class="video-subtitle" title="又名：可以帮忙洗干净吗？/可以幫忙洗乾淨嗎？/大姐姐的绮丽日常/Kirei ni Shitemoraemasu ka">可以帮忙洗干净吗？/可以幫忙洗乾淨嗎？/大姐姐的绮丽日常/Kirei ni Shitemoraemasu ka</h2>'''
	youming = page.ele('.video-subtitle').text
	print(f"又名: {youming}")

	'''<div class="video-info-main">

						<div class="video-info-items"><span class="video-info-itemtitle">别名：</span>
							<div class="video-info-item video-info-actor"><span class="slash">/</span>
							可以帮忙洗干净吗？/可以幫忙洗乾淨嗎？/大姐姐的绮丽日常/Kirei ni Shitemoraemasu ka						</div>
						</div>
						<div class="video-info-items"><span class="video-info-itemtitle">年份：</span>
							<div class="video-info-item video-info-actor"><span class="slash">/</span>
							2026						</div>
						</div>
						<div class="video-info-items"><span class="video-info-itemtitle">  备注：</span>
							<div class="video-info-item">更新至01集</div>
						</div>
						<div class="video-info-items"><span class="video-info-itemtitle">标签：</span>
							<div class="video-info-item video-info-actor"><span class="slash">/</span>
							<a href="/search/----%E6%B2%BB%E6%84%88---------.html" target="_blank">治愈</a><span class="slash">/</span><a href="/search/----%E6%97%A5%E5%B8%B8---------.html" target="_blank">日常</a><span class="slash">/</span><a href="/search/----%E6%97%A5%E6%9C%AC%E5%8A%A8%E6%BC%AB---------.html" target="_blank">日本动漫</a><span class="slash">/</span>						</div>
						</div>
						<div class="video-info-items"><span class="video-info-itemtitle">更新：</span>
							<div class="video-info-item">2026-01-06 </div>
						</div>
						<!--
											-->
						<div class="video-info-items"><span class="video-info-itemtitle">剧情：</span>
							<div class="video-info-item video-info-content vod_content">
								杉元与阿席莉帕的旅程达到了高潮！！围绕从爱努人那里夺来的金块展开的生存竞争生存战，最终章正式开始！！！从萨哈林返回北海道的“不死身的杉元”杉元佐一与爱努少女阿席莉帕，再次与白石由竹一起踏上寻找金块的旅程。在此过程中，他们与越狱囚犯海盗房太郎结盟，目标是前往札幌，追踪另一名越狱囚犯上地...
								<a href="javaScript:;" class="morecontent">展开</a></div>
						</div>
					</div>'''
	# 4.别名定位
	bianming = page.ele('xpath://div[@class="video-info-items"][span[contains(text(),"别名")]]/div').text
	bianming = bianming.replace('/', '').strip()
	print(f"别名: {bianming}")

	# 6. 备注定位
	remark = page.ele('xpath://div[@class="video-info-items"][span[contains(text(),"备注")]]/div').text
	print(f"备注: {remark}")

	# 7. 标签定位 (eles 获取多个)
	tags_eles = page.eles('xpath://div[@class="video-info-items"][span[contains(text(),"标签")]]/div/a')
	tags = [tag_ele.text for tag_ele in tags_eles]
	print(f"标签: {', '.join(tags)}")

	# 8. 更新时间定位
	update_time = page.ele('xpath://div[@class="video-info-items"][span[contains(text(),"更新")]]/div').text
	print(f"更新时间: {update_time}")

	# 9. 剧情定位（展开）
	more_btn = page.ele('.morecontent')
	if more_btn:
		more_btn.click()
	# 获取全文
	plot = page.ele('xpath://div[@class="video-info-items"][span[contains(text(),"剧情")]]/div').text

	# 去掉“收起”和多余的空格换行
	plot = plot.replace('收起', '').strip()

	print(f"展开后的剧情: {plot}")
	# 打印当前网址
	print(f"网址: {url}")
	# print 分割线
	print('-' * 50)

	# 写入文件
	f.write(f"标题: {title}\n别名: {bianming}\n备注: {remark}\n剧情: {plot}\n网址: {url}\n{'-'*50}\n")

	# 等待5秒再进入下一个
	page.wait(5)