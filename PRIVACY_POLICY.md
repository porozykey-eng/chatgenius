# Privacy Policy for ChatGenius AI

**Last Updated:** 2026-07-03  
**Effective Date:** 2026-07-03  
**Applicable Version:** v3.0.0 and above

We take your privacy seriously. This Privacy Policy explains how the ChatGenius AI browser extension (the "Extension") and its accompanying backend services collect, use, store, and protect your data.

## 1. Information We Collect

The Extension follows the principle of data minimization and only collects the following data when necessary:

| Data Type | Description | Storage Location |
|---|---|---|
| **AI Provider API Key** | The provider key you enter to call AI APIs | Local `chrome.storage.local` only |
| **Selected AI Provider** | Identifier such as OpenAI, DeepSeek, Zhipu, etc. | Local `chrome.storage.local` only |
| **Persona Settings / FAQ Knowledge Base** | Your custom reply styles and knowledge entries | Local `chrome.storage.sync` only |
| **Activation Code** | License key entered when upgrading to Pro | Local + Server (encrypted) |
| **Device Fingerprint** | Hash of UA/language/timezone, used to bind activation code to the device | Local + Server |
| **Order Information** | Order number, amount, payment channel, payment time | Server (retained 5 years for financial compliance) |
| **Heartbeat Logs** | IP, fingerprint, timestamp, used for license validity verification | Server (retained 90 days) |
| **Invoice Request Information** | Title, tax ID, email (only when you actively request an invoice) | Server (retained 5 years) |

> **What We Never Collect:** We do not collect your chat content, contact lists, message history, browser history, or web access records, nor do we read the conversation text on WhatsApp/Messenger/Facebook pages. AI reply requests are sent directly from your browser to the AI provider you selected and do not pass through our servers.

## 2. Purposes of Data Use

The data we collect is strictly used for the following purposes:

- **Providing AI auto-reply**: Using your API Key and persona settings to call the AI provider's API
- **License verification**: Confirming you are a legitimate Pro user via activation code + device fingerprint
- **Anti-fraud and anti-abuse**: Preventing activation codes from being shared or stolen through IP and fingerprint verification
- **Order fulfillment and after-sales**: Processing payments, issuing invoices, and providing refunds
- **Service improvement**: Using aggregated statistics (non-personally identifiable) to optimize the product experience

## 3. Data Storage and Transmission

### 3.1 Local Storage
Your API Key, AI provider selection, persona settings, FAQ knowledge base, and other sensitive configurations are stored only in the browser's `chrome.storage.local`. They are never uploaded to our servers, nor are they uploaded to Google Cloud via Chrome's sync feature.

### 3.2 Server Storage
The following data is stored on our servers (hosted on cloud providers within China):

- **Activation codes**: Used for license verification (once bound to a device fingerprint, they cannot be used on other devices)
- **Order data**: Order information returned by the payment channel, retained for 5 years (financial compliance requirement)
- **Heartbeat logs**: Automatically cleaned up after 90 days
- **IP ban records**: 5 consecutive activation failures will result in a 24-hour IP ban

### 3.3 Transmission Encryption
All communication between the client and server is encrypted via HTTPS (TLS 1.2+). Payment callbacks use HMAC-SHA256 signatures + AES-256-GCM encryption verification to prevent data tampering or eavesdropping.

## 4. Third-Party Data Sharing

We do not sell, rent, or trade your personal information. In the following situations, we may share necessary data:

### 4.1 AI Providers
When you use the AI auto-reply feature, your chat context (the message you are replying to) is sent directly from your browser to the AI provider you selected (e.g., OpenAI, DeepSeek, Zhipu). This process does not pass through our servers. Each provider's data processing is governed by their own privacy policy.

### 4.2 Payment Providers
When purchasing the Pro version, order information is sent to Alipay or WeChat Pay. The payment provider's processing is governed by their privacy policy.

### 4.3 Legal Requirements
When required by laws and regulations, demanded by government authorities in accordance with the law, or to protect legitimate rights and interests, we may share necessary data.

## 5. Your Rights

Under applicable data protection laws (including the Personal Information Protection Law of China and the GDPR), you have the following rights:

- **Right of access**: You may view all data stored locally in the Extension at any time
- **Right to rectification**: You may modify your configuration in the Extension's settings
- **Right to erasure**: Uninstalling the Extension deletes all local data; server-side data may be deleted by contacting support
- **Right to withdraw consent**: You may disable or uninstall the Extension at any time from the Chrome extensions management page
- **Right to data portability**: The Extension's settings page supports exporting a configuration JSON file
- **Right to object**: You may object to specific data processing activities

> **How to exercise these rights:** To exercise the above rights, please contact us using the contact information at the end of this policy. We will respond to your request within 15 business days.

## 6. Data Security

We take the following technical and organizational measures to protect your data:

- **Transmission encryption**: Full-site HTTPS + TLS 1.2+
- **Payment security**: HMAC-SHA256 signatures + AES-256-GCM encryption
- **Anti-replay attacks**: All sensitive endpoints use 5-minute timestamp verification
- **Anti-brute-force**: 5 consecutive activation failures will result in a 24-hour IP ban
- **Principle of least privilege**: The Extension only requests necessary browser permissions
- **Permission minimization**: AI provider domains use `optional_host_permissions`; access is only requested when you select a specific provider
- **Access control**: Server database access is protected by IP whitelisting and key authentication

## 7. Cookies and Similar Technologies

The Extension does not use cookies. The backend server uses necessary session cookies for admin login, only for authentication, not for cross-site tracking.

## 8. Children's Privacy

This Extension is intended for users aged 18 and above. We do not knowingly collect personal information from minors. If you are a minor, please use this Extension under the guidance of a guardian. If you discover we have inadvertently collected information from a minor, please contact us to delete it.

## 9. International Users

Our servers are located within China. If you access this Extension from another country or region, please be aware that your data will be transferred to China and processed in accordance with Chinese laws and regulations. Continued use constitutes your consent to this cross-border transfer.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. The updated policy will be published on this page with an updated "Last Updated" date. In the event of material changes, we will notify you via in-Extension notifications or an announcement on the official website. Continued use of the Extension constitutes your agreement to the updated policy.

## 11. Contact Us

If you have any questions, suggestions, or complaints regarding this Privacy Policy, you may contact us through the following:

- **Official Website:** https://chat.sopie.cc/
- **After-sales QQ Group:** See the bottom of the Extension's settings page
- **Feedback Email:** Please submit via the contact form on the official website

We will respond to your privacy-related requests within 15 business days.

---

**Data Controller Information:**  
ChatGenius AI Team  
Email: support@chatgenius.ai
