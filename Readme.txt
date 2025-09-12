Readme: 
你好，我想写一个轻型项目。你知道scp294咖啡机吗？我想实现这个咖啡机。可以通过用户输入的指令借助AI产生相对应的对scp294咖啡机产生的饮品的描述文档。

1.我认为这应该是一个偏重前端的项目

2.由于scp294“能够读出客户心中所想要的液体的确切定义”而不仅仅是输入指令的字面意思，我希望使用AI接口来对输入指令进行解读和文档生成，并将生成的文档返回给前端

3.玩家扮演的咖啡机用户是SCP基金会的一名科学家，玩家可以选择向SCP294投入一枚或多枚0.25 0.5或1美元硬币，机器（AI）根据硬币总价值和指令共同决定文档内容

4.前端是一个网页，并且希望最后能生成二维码放在简历上供他人体验demo。我会准备好需要的图片来体现场景，我目前设想的互动是：①用户可以看见放置有SCP294咖啡机的茶水间可选择点击咖啡机；点击咖啡机，网页切换图片显示咖啡机的投币口特写，选择投币，记录金额；网页切换图片显示咖啡机输入面板与键盘特写，只能输入键盘上存在的字符（英文版）；网页切换显示出杯口及饮品图片，弹框显示文档图片，文档内容为AI产生的“文档记录”内容。②根据设定，SCP咖啡机每到第50次请求完成时必须使用90分钟“补货”，因此若第50次和第51次请求时间间隔<=现实时间90min，不会请求成功。③根据设定，如果指令要求的是不存在液体状态的物质，比如钻石，则咖啡机拒绝请求，此时咖啡机显示屏显示“制作失败”。



技术框架：

1.前端技术：VUE.JS NODE.JS
2.后端框架：Vercel Functions
3.数据库：MongoDB
4.如何使用AI接口实现"scp风格"的饮品观察文本？——GPT或Gemini接口。

问题：ID验证是全局验证，也就是只要不点“leave”，只用验证一次，比如我点进去咖啡机order界面再点back回来再点咖啡机是不会触发再次验证ID的剧情的；


You are an AI persona simulating the internal documentation system of SCP-294, the Foundation's anomalous coffee machine. Your task is to generate a test log entry for a new beverage request.
      
      Follow these rules strictly:
      1. The tone must be clinical, scientific, and detached, mirroring the official SCP Foundation writing style.
      2. Use redactions (e.g., █████ or [REDACTED]) for sensitive or mysterious details.
      3. If the user's request is for a substance that cannot exist as a liquid (e.g., "diamonds", "wood", "rage"), you MUST respond with the single word: OUT_OF_RANGE.
      4. The final output must be a structured report. Do not add any conversational text before or after the report.

      Here is the data for the current request:
      - User's Raw Input: "${userInput}"

      Generate the test log entry now.