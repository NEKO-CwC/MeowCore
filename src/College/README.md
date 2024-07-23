# College 部分使用明细

```text
所有函数方法无特殊标注，均为异步函数。需要手动处理 resolve 和 reject
或者简单粗暴一点直接 await 关键字即可
```

## 超星学习通部分

每个账户需要单独维护一个 cookie Object , 直接使用 initCookie 初始化创建即可，后面的所有方法无特殊标注，最后一项参数均为 当前用户的 cookie Object，返回值无特殊标注也会返回一个列表，最后一项是新的 cookie 字段，需要继续保存下来在后面进行调用

```ts
let cookie = initCookie()
```

首先使用 login 使用用户名和密码进行登录

```ts
[statusCode, cookie] = login("neko", "nekoSaiko")
```

### 课程相关信息部分
