import json
import os

def update_icon_json():
    # 文件路径配置
    md_path = r'D:\？\all.md'
    json_path = r'D:\？\all.json'

    # 1. 读取 MD 文件中的 URL
    if not os.path.exists(md_path):
        print(f"错误: 找不到文件 {md_path}")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        # 读取每一行，去除空格和换行符，并过滤掉空行
        urls = [line.strip() for line in f if line.strip().startswith('http')]

    # 2. 读取现有的 JSON 内容
    if not os.path.exists(json_path):
        print(f"错误: 找不到文件 {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print("错误: JSON 文件格式不正确")
            return

    # 3. 处理数据：避免重复添加
    # 获取现有 JSON 中已有的 URL 集合，用于去重
    existing_urls = {icon['url'] for icon in data.get('icons', [])}

    new_icons_count = 0
    for url in urls:
        if url not in existing_urls:
            name = url.split('/')[-1].split('.')[0]
            
            new_item = {
                "name": name,
                "url": url
            }
            data['icons'].append(new_item)
            existing_urls.add(url)
            new_icons_count += 1

    # 4. 写回 JSON 文件
    with open(json_path, 'w', encoding='utf-8') as f:
        # ensure_ascii=False 保证中文不乱码，indent=4 保持美观
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f"处理完成！")
    print(f"从 MD 中读取到 {len(urls)} 条链接")
    print(f"成功新增 {new_icons_count} 条图标数据到 JSON")

if __name__ == "__main__":
    update_icon_json()