# Docker Compose Collection

> 5 个项目的 docker-compose.yml 合集

---

## 目录

1. [Echo-Nanshare](#echo-nassha)
2. [Echo-Symedia](#echo-symedia)
3. [Echo-music](#echo-music)
4. [Echo-MusicTag](#echo-musictag)
5. [Echo-MediaVault](#echo-mediavault)

---

## Echo-Nanshare

> Wiki：https://wiki.nanl.top/intro/docker

- **镜像**: `huayueer/echo-nassha:latest`
- **容器名**: `nanshare`
- **端口**: `8080:80` (Web), `8115:8115` (API)
- **说明**: NanShare NAS 部署版

```yaml
# NanShare NAS 部署版 docker-compose
services:
  nanshare:
    image: huayueer/echo-nassha:latest
    container_name: nanshare
    ports:
      - "8080:80"       # [宿主机:容器] 前端界面（Caddy 反向代理）→ http://localhost:8080
      - "8115:8115"     # [宿主机:容器] Flask 后端 API 直连
    volumes:
      - ./config:/app/config            # 配置目录（唯一需要持久化的数据），放数据库、配置文件等
      # - /var/run/docker.sock:/var/run/docker.sock    # Docker 套接字（不需要容器管理就注释掉）
    environment:
      - TZ=Asia/Shanghai                # 时区：上海
      - HTTP_PROXY=                     # 清除代理（容器内无法访问 host 代理）
      - HTTPS_PROXY=                    # 清除 HTTPS 代理
    restart: unless-stopped             # 除非手动停止，否则自动重启
```

---

## Echo-Symedia

> Wiki：https://wiki.viplee.cc/symedia/guide/intro/

- **镜像**: `huayueer/echo-staymdia:v1.0.58.10`
- **容器名**: `symedia`
- **网络模式**: `host`（直接使用宿主机网络，不做端口隔离）
- **端口**: `8095:8095`
- **说明**: 影音媒体中心，集成 Playwright，支持双因素认证

```yaml
services:
  symedia:
    image: huayueer/echo-staymdia:v1.0.58.10    # 镜像版本，更新时改版本号即可
    container_name: symedia
    restart: always                              # 总是自动重启
    network_mode: host                           # host 模式 = 容器直接用宿主机网络，端口映射不生效
    ports:
      - 8095:8095                               # 如果用 bridge 模式才生效，host 模式下这行可省略
    environment:
      - TZ=Asia/Shanghi                          # 时区：上海
      - LICENSE_KEY=test_local_dev_2026          # 许可证密钥（破译版随便填，正版需填真实 key）
      - NO_PROXY=localhost,127.0.0.1,::1,172.17.0.1  # 不走代理的地址（配了 HTTP_PROXY 才需要）
      - SA_2FA=true                              # 双因素认证，推荐开 true，登录报错则改 false
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro    # Docker 套接字（必需）：:ro 只读，安全考虑不要去掉
      - /volume1/appdata/symedia/config:/app/config     # 配置目录（必需）：放 config.yaml、数据库等
      - /volume1/appdata/symedia/playwright:/symedia/.cache/ms-playwright  # Playwright 浏览器缓存：避免每次启动重新下载 chromium
      - /volume1/CloudNAS:/CloudNAS:rslave              # 云盘挂载路径（必需）：对应 config.yaml 的 cloud_nas_path，飞牛系统改 rshared
      - /volume1/media:/media                           # 媒体目录（必需）：对应 config.yaml 的 media_path，放电影/电视剧
```

---

## Echo-music

> 自行摸索，没有 Wiki

- **镜像**: `huayueer/echo-music:latest`
- **容器名**: `echo-music`
- **端口**: `8080:5000`
- **说明**: 音乐播放/管理下载服务

```yaml
services:
  echo-music:
    image: huayueer/echo-music:latest
    container_name: echo-music
    ports:
      - "8080:5000"               # [宿主机:容器] 访问 http://localhost:8080 进入音乐服务
    volumes:
      - /vol2/1000/downloads/music:/app/data/music   # 音乐文件目录：你的歌曲文件放这里
      - ./data:/app/data                              # 数据目录：数据库/配置等（相对于 compose 文件的路径）
    restart: unless-stopped       # 除非手动停止，否则自动重启
```

---

## Echo-MusicTag

> Wiki：https://xiers-organization.gitbook.io/music-tag-web-v2/kuai-su-kai-shi

- **镜像**: `huayueer/echo-music-tag:latest`
- **容器名**: `echo-music-tag`
- **端口**: `8002:8002`
- **说明**: 音乐文件标签编辑工具（修改 mp3/flac 等文件的元数据）

```yaml
version: '3'

services:
  echo-music-tag:
    image: huayueer/echo-music-tag:latest
    container_name: echo-music-tag
    ports:
      - "8002:8002"               # [宿主机:容器] 访问 http://localhost:8002 进入标签编辑界面
    volumes:
      - /path/to/your/music:/app/media     # 音乐目录（替换 /path/to/your/music 为你的音乐文件夹路径）
      - /path/to/your/config:/app/data     # 配置目录（替换 /path/to/your/config 为配置存放路径）
      - /path/to/your/download:/app/download  # 下载目录（替换 /path/to/your/download 为下载文件夹路径）
    restart: always               # 总是自动重启
```

---

## Echo-MediaVault

> Wiki：https://doc.mediavault.qzz.io/docs#deploy

- **镜像**: `huayueer/echo-mediaventt:latest`
- **容器名**: `mediavault_patched`
- **端口**: `5555:7811` (Web/API), `8091:8091` (Emby 代理)
- **说明**: 媒体库管理工具，含健康检查

```yaml
version: "3.8"

services:
  mediavault:
    image: huayueer/echo-mediaventt:latest
    container_name: mediavault_patched
    restart: unless-stopped               # 除非手动停止，否则自动重启
    ports:
      - "5555:7811"       # [宿主机:容器] Web 管理界面 + API → 访问 http://localhost:5555
      - "8091:8091"       # [宿主机:容器] Emby 代理接口 → 给 Emby 连的代理端口
    volumes:
      - /vol3/1000/Docker/mediavault/config:/config   # 配置目录：放配置文件、数据库等
      - /vol2/1000/downloads:/media                    # 媒体目录：你的下载文件/影视文件存放位置
    environment:
      - TZ=Asia/Shanghai                     # 时区：上海
      # 如果走代理，取消下面几行的注释（把 host.docker.internal:7890 换成你的代理地址）
      # - http_proxy=http://host.docker.internal:7890
      # - https_proxy=http://host.docker.internal:7890
      # - HTTP_PROXY=http://host.docker.internal:7890
      # - HTTPS_PROXY=http://host.docker.internal:7890
      # - ALL_PROXY=http://host.docker.internal:7890
      # - NO_PROXY=localhost,127.0.0.1
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7811/api/v1/system/health"]   # 健康检查命令
      interval: 30s          # 每 30 秒检查一次
      timeout: 10s           # 每次检查超时 10 秒
      start_period: 5s       # 容器启动后等 5 秒再开始检查
      retries: 3             # 连续失败 3 次标记为不健康
```

---

*生成时间: 2026-05-28*
