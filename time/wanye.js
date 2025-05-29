/*
脚本名称：万夜图片
脚本作者：YueJS
脚本说明：点击通知查看图片
*/

// 图片接口
const urls = [
    'http://3650000.xyz/api/360.php?cid=6'
    // 预留更多接口位置
    // 'http://第二个接口',
    // 'http://第三个接口'
];

// 当前使用第几个接口（从0开始）
const currentIndex = 0;

// 主方法
function getImage() {
    const url = urls[currentIndex];
    const options = {
        url: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
    };

    $httpClient.get(options, (error, response, data) => {
        if (error) {
            $notification.post('万夜图片', '获取失败 ❌', error);
            console.log('请求失败：' + error);
            $done();
            return;
        }

        if (response.status === 200) {
            $notification.post(
                '万夜图片', 
                '获取成功 ✅', 
                '点击查看大图', 
                {
                    'open-url': url,
                    'media-url': url
                }
            );
            console.log('图片获取成功');
        } else {
            $notification.post('万夜图片', '获取失败 ❌', '服务器响应异常');
            console.log('响应异常：' + response.status);
        }
        $done();
    });
}

// 执行
getImage();
