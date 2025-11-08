import requests
import re

#=============================================================================================================================================================================================================
#   单页爬取下载图片
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
}

url = "http://www.netbian.com"
response = requests.get(url=url, headers=headers)
response.encoding = "gbk"# 解决乱码
html_data = response.text
# print(response.text)

# 只保留这两行正确的
img, title = re.findall('<img src="(.*?)" alt="(.*?)"', html_data)[1]
print(img)  # 打印src
print(title)  # 打印标题

# img_content = requests.get(url=img, headers=headers).content
# with open("img/" + title +'.jpg', mode="wb") as f:
#     f.write(img_content)    
# print("下载完成")


#==============================================================================================================================================================================================================
#   批量爬取下载图片

link = "http://www.netbian.com/"#链接
linkdata = requests.get(url=link, headers=headers).text#获取网页数据
links = re.findall(r'<a.*?href="/desk/(\d+)\.htm"', linkdata)#获取链接
print(links)
for linksid in links:#遍历链接
    url = f'http://www.netbian.com/desk/{linksid}.htm'
    response = requests.get(url=url, headers=headers)
    response.encoding = "gbk" # 解决乱码
    html_data = response.text
    # print(response.text)

    # 只保留这两行正确的
    img, title = re.findall('<img src="(.*?)" alt="(.*?)"', html_data)[1]
    print(img)  # 打印src
    print(title)  # 打印标题

    img_content = requests.get(url=img, headers=headers).content
    with open("img/" + title +'.jpg', mode="wb") as f:
        f.write(img_content)    
    print("下载完成")
