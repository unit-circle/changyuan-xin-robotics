# Cloudflare 完整部署指南

本指南用于把 XCY Robotics Academic Portfolio 部署到：

```text
https://changyuanxin.dpdns.org
```

网站使用 Cloudflare Worker 运行，D1 保存网站数据，R2 保存图片与文件，
Cloudflare Access 保护后台管理页面。

## 0. 部署完成后的结构

```text
公开网站
https://changyuanxin.dpdns.org
├── /research
├── /coursework
├── /publications
├── /cv
├── /resources
└── /private

管理员专用
https://changyuanxin.dpdns.org/admin
├── Cloudflare Access 登录
├── 编辑个人信息与首页内容
├── 新增/修改项目、课程和研究成果
├── 上传图片与文件到 R2
└── 创建和撤销私密资料授权码
```

## 1. 打开项目目录

打开 PowerShell，执行：

```powershell
cd "E:\codex\projects\changyuan-xin-robotics"
```

确认当前位置：

```powershell
Get-Location
```

应该显示：

```text
E:\codex\projects\changyuan-xin-robotics
```

## 2. 安装项目依赖

项目已经包含锁定版本的 `package-lock.json`。执行：

```powershell
npm ci
```

如果已经安装过依赖且没有删除 `node_modules`，这一步仍可以重新执行，
确保本地依赖和项目锁定版本完全一致。

## 3. 登录 Cloudflare

执行：

```powershell
npm run cf:login
```

浏览器会打开 Cloudflare 授权页面。登录包含
`changyuanxin.dpdns.org` 的同一个 Cloudflare 账户，点击允许授权。

回到 PowerShell，验证：

```powershell
npm run cf:whoami
```

只有当它显示当前 Cloudflare 账户和 Account ID 后，才继续下一步。

如果仍显示 `You are not authenticated`：

```powershell
npm run cf:login
```

重新完成浏览器授权，然后再次运行 `npm run cf:whoami`。

## 4. 创建 D1 数据库

执行：

```powershell
npm run cf:d1:create
```

成功后输出中会包含一个真实的 `database_id`，形式类似：

```text
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

打开：

```text
wrangler.jsonc
```

找到：

```json
"database_id": "00000000-0000-4000-8000-000000000000"
```

只把引号内的占位 ID 替换为刚才命令返回的真实 ID。不要修改：

```json
"binding": "DB",
"database_name": "changyuan-xin-portfolio"
```

保存文件后，运行保护性检查：

```powershell
npm run cf:validate
```

应该显示：

```text
Cloudflare configuration check passed
```

## 5. 创建 R2 文件存储

执行：

```powershell
npm run cf:r2:create
```

R2 Bucket 名称固定为：

```text
changyuan-xin-portfolio-uploads
```

如果命令提示同名 Bucket 已存在，先进入 Cloudflare 控制台的
`R2 object storage` 检查。只要它属于当前账户且名称完全一致，就不需要重复创建。

## 6. 初始化远程数据库

执行：

```powershell
npm run cf:d1:migrate
```

如果 PowerShell 询问是否将迁移应用到远程数据库，输入：

```text
y
```

迁移完成后，D1 已具备网站内容、项目、课程、文件、授权码和访问记录所需的表。
网站第一次访问时会自动写入内置的初始简历与项目内容。

## 7. 上线前本地检查

依次执行：

```powershell
npm run typecheck
npm run lint
npm test
```

三条命令都必须成功。`npm test` 会完成生产构建，并检查首页、研究、
课程、项目详情、CV、资源、私密入口、站点地图和 404 页面。

## 8. 部署到 Cloudflare

执行：

```powershell
npm run cf:deploy
```

该命令会依次完成：

1. 检查域名、D1 ID、R2 名称和管理员邮箱；
2. 生成生产构建；
3. 发布 Worker；
4. 绑定 `changyuanxin.dpdns.org` 自定义域名；
5. 让 Cloudflare 自动建立所需 DNS 记录并签发 HTTPS 证书。

部署成功后，PowerShell 会显示 Worker 的发布结果和访问地址。

首次绑定自定义域名后，HTTPS 证书可能需要几分钟才完全生效。在此期间不要
反复删除或重新添加域名。

## 9. 检查公开网站

浏览器依次打开：

```text
https://changyuanxin.dpdns.org/
https://changyuanxin.dpdns.org/research
https://changyuanxin.dpdns.org/coursework
https://changyuanxin.dpdns.org/publications
https://changyuanxin.dpdns.org/cv
https://changyuanxin.dpdns.org/resources
https://changyuanxin.dpdns.org/private
```

也可以在 PowerShell 一次性检查：

```powershell
npm run cf:verify
```

全部显示 `[PASS]` 即代表公开页面正常。

## 10. 配置后台登录保护

这一步在网站部署成功后进行。目标是：

```text
公开页面：任何人都能查看
/admin*：只有 unitcirclexin@gmail.com 能进入
/api/admin/*：只有 unitcirclexin@gmail.com 能调用
```

### 10.1 打开 Zero Trust

1. 登录 Cloudflare Dashboard。
2. 左侧进入 `Zero Trust`。
3. 第一次使用时，按页面提示创建免费的 Zero Trust 组织。
4. 进入 `Access controls` → `Applications`。
5. 点击 `Create new application`。
6. 选择 `Self-hosted and private`。
7. 点击 `Add public hostname`。

### 10.2 添加后台页面路径

填写：

```text
Application name: XCY Portfolio Admin
Domain: changyuanxin.dpdns.org
Path: admin*
```

这里的 `admin*` 会保护 `/admin` 及其下级路径。

### 10.3 添加后台 API 路径

在同一应用中继续点击 `Add public hostname`，再添加：

```text
Domain: changyuanxin.dpdns.org
Path: api/admin/*
```

如果当前 Cloudflare 界面不允许同一应用添加第二个路径，就创建第二个
Self-hosted 应用，名称使用：

```text
XCY Portfolio Admin API
```

并只保护：

```text
api/admin/*
```

两个路径必须都保护。只保护 `/admin` 而不保护 `/api/admin/*` 不完整。

### 10.4 创建 Allow 策略

在 Access policies 中新增策略：

```text
Policy name: Changyuan Xin only
Action: Allow
Include: Emails
Value: unitcirclexin@gmail.com
```

不要使用 `Everyone`，也不要把整个
`changyuanxin.dpdns.org` 域名都放进 Access，否则教授和普通访客会在首页就被要求登录。

### 10.5 选择登录方式

新的 Zero Trust 组织通常可以直接使用 Cloudflare identity provider。
也可以在：

```text
Zero Trust → Integrations → Identity providers
```

添加 `One-time PIN`。使用 OTP 时，Cloudflare 会把一次性验证码发送到：

```text
unitcirclexin@gmail.com
```

推荐设置：

```text
Session duration: 24 hours
```

保存应用与策略。

## 11. 验证后台

打开浏览器无痕/InPrivate 窗口，访问：

```text
https://changyuanxin.dpdns.org/admin
```

正确结果：

1. 先出现 Cloudflare Access 登录；
2. 使用 `unitcirclexin@gmail.com` 通过验证；
3. 登录后进入 Administration Workspace；
4. 可以编辑内容、上传图片/文件、管理项目和授权码。

再用另一个邮箱测试，应该被拒绝。

后台采用双层保护：

1. Cloudflare Access 在网站外层阻止未授权请求；
2. Worker 内部的 `ADMIN_EMAILS` 再核对邮箱。

## 12. 第一次后台内容检查

登录 `/admin` 后，按顺序检查：

1. `Profile`：姓名、学校、专业、邮箱、研究方向；
2. `Projects`：研究项目和大创项目；
3. `Coursework`：课程类别、说明、图片和证据；
4. `Research outputs`：论文、报告与研究记录；
5. `Media`：上传一张测试图片，确认 R2 正常；
6. `Access codes`：创建一个短期测试授权码；
7. 在无痕窗口进入 `/private`，验证授权码；
8. 测试完成后在后台撤销测试授权码。

正式发布前，把测试内容和测试文件删除或改为真实资料。

## 13. 以后更新网站

每次修改代码后，在项目目录执行：

```powershell
npm run typecheck
npm run lint
npm test
npm run cf:deploy
npm run cf:verify
```

后台修改文字、图片、项目和文件时不需要重新部署，保存后数据会直接写入 D1/R2。
只有修改网站代码、样式、组件或路由时才需要重新执行 `npm run cf:deploy`。

## 14. 常见问题

### `You are not authenticated`

执行：

```powershell
npm run cf:login
npm run cf:whoami
```

### `database_id is still the placeholder`

重新执行：

```powershell
npm run cf:d1:create
```

把返回的真实 ID 写入 `wrangler.jsonc`。

### 找不到 R2 Bucket

执行：

```powershell
npm run cf:r2:create
```

确认名称是：

```text
changyuan-xin-portfolio-uploads
```

### 自定义域名创建失败

确认：

1. Cloudflare 中 `changyuanxin.dpdns.org` 的 Zone 状态为 `Active`；
2. DigitalPlat 的名称服务器仍是 Cloudflare 分配的两个 NS；
3. Cloudflare DNS 中没有占用该主机名的现有 CNAME；
4. 当前 Wrangler 登录的是持有这个 Zone 的同一账户。

### `/admin` 显示未提供身份

说明 Worker 已运行，但 Cloudflare Access 尚未覆盖该路径。检查：

```text
admin*
api/admin/*
```

是否都配置在 Access 的 Self-hosted 应用中。

### 后台出现 401 或 403

检查：

1. 登录邮箱是否严格等于 `unitcirclexin@gmail.com`；
2. Access Allow 策略是否使用 Emails；
3. `wrangler.jsonc` 中 `ADMIN_EMAILS` 是否正确；
4. 修改 `wrangler.jsonc` 后是否重新执行了 `npm run cf:deploy`。

## 15. 域名续期提醒

DigitalPlat 控制台显示该免费域名有续期周期。请以 DigitalPlat 当前规则为准，
在允许续期的时间窗口内及时续期，否则 Cloudflare 上的网站代码和数据仍在，
但 `changyuanxin.dpdns.org` 可能无法继续解析。

## 16. 重要文件

```text
wrangler.jsonc                 Cloudflare 域名、D1、R2 和管理员配置
drizzle/                       D1 数据库迁移
app/content.ts                 初始网站内容
app/admin/                     后台管理界面
app/api/admin/                 后台管理接口
scripts/validate-cloudflare-config.mjs
                               部署前防误配置检查
scripts/verify-deployment.ps1  上线后公开页面检查
```

不要把 Cloudflare API Token、密码、Cookie、私密文件或真实授权码写入代码库。

## 17. Cloudflare 官方参考

- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare Access self-hosted applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)
- [Cloudflare Access application paths](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/)
- [Cloudflare Access One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
