我想写一个 Token API 审计与管理系统。需求如下：

- 用户系统
    - 存在 超级管理员 账号（预置用户名、密码）
        - 超级管理员 可以 创建用户，修改用户密码，重置用户的key
        - 超级管理员 可以查看用户之前的所有请求（用户不可见）
    - 用户的信息字段：姓名，邮箱， 密码（不要明文存储），key（这个key是本系统生成的，以 sk-… 打头，也遵守 openai 的调用格式），还有什么 created at, updated at 之类的
        - 用户可以自己重置 key
- API 管理系统 (超级管理员可以进行管理)
    - API 的信息：base url，key
- 模型管理系统
    - 提供一个默认接口，将 某一个 API 的所有模型导入（curl /models）
    - 模型的参数请参考 openrouter，一定要把billing计费功能相关的字段实现
- 模型组管理系统
    - 可以将一些模型打成组，超级管理员可配置不同的组
- 用户-模型组 关联
    - 可以为用户配置不同的【模型组“资源包”+限额】
        - 比如，给了gpt-4o+gpt-4.1  创建了一个模型组，然后配一个 $10 的限额，用户用自己的 key 访问这个资源包的时候就可以用了
- 其他暴露出来的 API，最重要的就是用户能请求这个服务，然后我们把它转发出去

现在请你和我讨论，哪几个模块，模型的设计，视图函数的设计，API 接口的设计

用 django 实现后端，用你喜欢的方法实现前端