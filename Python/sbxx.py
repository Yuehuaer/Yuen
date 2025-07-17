import os
import pyautogui


class Sbxx:
    """自动化工具类"""

    def __init__(self, confidence=0.9, default_img_dir=None):
        """
        初始化工具类
        :param confidence: 图片匹配阈值（0.0 - 1.0），需要安装opencv - python
        :param default_img_dir: 默认的图片文件夹路径，可选
        """
        self.confidence = confidence
        self.default_img_dir = default_img_dir

    def find_image_position(self, image_name, script_dir=None):
        """
        在屏幕上查找指定图片并返回其坐标

        :param image_name: 图片文件名
        :param script_dir: 脚本所在目录（可选），用于构建相对路径。若为None，尝试使用默认图片文件夹
        :return: 成功返回 (x, y) 坐标元组，失败返回 None
        """
        try:
            # 构建图片路径
            if script_dir:
                image_path = os.path.join(script_dir, image_name)
            elif self.default_img_dir:
                image_path = os.path.join(self.default_img_dir, image_name)
            else:
                image_path = image_name  # 假设传入的是绝对路径

            # 检查图片是否存在
            if not os.path.exists(image_path):
                return None

            # 在屏幕上查找图片
            location = pyautogui.locateOnScreen(
                image_path,
                confidence=self.confidence
            )

            if location:
                # 获取图片中心坐标并转换为标准元组 (x, y)
                center = pyautogui.center(location)
                return (int(center.x), int(center.y))  # 转换为整数元组
            else:
                return None

        except pyautogui.ImageNotFoundException:
            return None
        except Exception:
            return None
