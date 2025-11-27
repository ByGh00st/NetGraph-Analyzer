<div align="center">

<img width="1200" height="475" alt="NetGraph Analyzer System Banner" src="https://i.hizliresim.com/8ercp73.png" />

# ⚡ GHOST PROTOCOL: INTERFACE
### Güvenli Veri İletişimi ve Görselleştirme Arayüzü (Secure Data Transmission & Visualization Layer)

<!-- Steril, Yüksek Güvenlikli Rozetler -->
<p>
  <img src="https://img.shields.io/badge/Security-Level_5-critical?style=for-the-badge&logo=shield&logoColor=white" alt="Security Level 5" />
  <img src="https://img.shields.io/badge/Core-backend.py_Locked-red?style=for-the-badge&logo=python&logoColor=white" alt="Backend Core Locked" />
  <img src="https://img.shields.io/badge/System-By_Ghost-black?style=for-the-badge" alt="Architected by ByGhost" />
</p>

</div>

---

## 📖 1. Projenin Amacı ve Felsefesi

**NetGraph-Analyzer**, karmaşık ağ verilerini analiz etmek, siber güvenlik operasyonlarını izlemek ve elde edilen sonuçları anlaşılır bir arayüz üzerinden görselleştirmek için tasarlanmış modüler bir frontend katmanıdır. Bu proje, ham veriyi anlamlı ve eyleme geçirilebilir istihbarata dönüştürmeyi hedefler.

Projenin temel felsefesi, **güçlü bir backend motoru** ile **güvenli ve izole bir frontend arayüzünü** birbirinden ayırmaktır. Sunulan bu arayüz, backend'den gelen şifreli veri akışını işlemek ve görselleştirmek üzere optimize edilmiştir.

---

## ✨ 2. Temel Özellikler

- **Gerçek Zamanlı Görselleştirme:** Backend'den gelen verileri anlık olarak grafiklere, tablolara ve ağ haritalarına dönüştürür.
- **Güvenli İletişim Protokolü:** Arayüz, `backend.py` ile sadece şifrelenmiş ve doğrulanmış veri paketleri üzerinden haberleşir.
- **Modüler Komponent Yapısı:** React ve TypeScript ile geliştirilen arayüz, yeni analiz modüllerinin kolayca entegre edilebilmesi için tasarlanmıştır.
- **Detaylı Analiz Panelleri:** IP izleme, paket analizi, DNS sorguları ve anomali tespiti gibi farklı operasyonlar için özelleştirilmiş gösterge panelleri sunar.

---

## ⚠️ 3. Mimarinin Kalbi ve KRİTİK GÜVENLİK UYARISI

Bu projenin halka açık olarak sunulması, bilinçli bir mimari karardır. Sistemin tüm işlevselliği, veri işleme mantığı ve güvenlik protokolleri, projenin beyni ve motoru olan **`backend.py`** dosyası içinde yer alır.

> **❗ DİKKAT:** **`backend.py` dosyası, potansiyel kötüye kullanımı önlemek ve projenin etik sınırlar içinde kalmasını sağlamak amacıyla bu repoya DAHİL EDİLMEMİŞTİR.**
>
> Bu dosya olmadan, arayüz sadece boş bir kabuk (shell) olarak çalışır ve hiçbir veri işleyemez. Sistemin omurgası olan bu dosya; API anahtarlarını, şifreleme algoritmalarını ve hedefle iletişim kurallarını içerir. `backend.py` olmadan sistem, güvenlik amacıyla kendini kilitleyerek herhangi bir yanıt vermeyecektir. Bu, tasarım gereğidir.

---

## 💻 4. Teknoloji Yığını (Tech Stack)

Bu arayüzün geliştirilmesinde kullanılan teknolojiler:

- **Frontend:** `TypeScript`, `React`, `Vite`, `Axios`
- **Backend (Konsept):** `Python`, `Flask`/`FastAPI`, `Socket.IO`, `Pandas` (Veri Analizi için)
- **Stil & Tasarım:** `CSS Modules`, `Framer Motion`

---

## 🛠️ 5. Kurulum ve Başlatma Protokolü (Deployment)

Arayüzü (shell modunda) çalıştırmak ve geliştirmeye başlamak için aşağıdaki adımları izleyin.

### **Gereksinimler**
- [Node.js](https://nodejs.org/en/) (v18+)
- [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/)

## 🛠️ 5. Kurulum ve Başlatma Protokolü (Deployment)

Arayüzü (shell modunda) çalıştırmak ve geliştirmeye başlamak için aşağıdaki adımları izleyin.

### **Gereksinimler**
- [Node.js](https://nodejs.org/en/) (v18+)
- [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/)

### **Kurulum Adımları**

**🚀 Adım 1: Bağımlılıkları Yükle (Install Dependencies)**

Projenin ihtiyaç duyduğu tüm `node` paketlerini ve bağımlılıkları sisteme yükleyin. Bu komut, `package.json` dosyasını okuyarak gerekli tüm modülleri `node_modules` klasörüne kuracaktır.

## 🛠️ 5. Kurulum ve Başlatma Protokolü (Deployment)

Arayüzü (shell modunda) çalıştırmak ve geliştirmeye başlamak için aşağıdaki adımları izleyin.

### **Gereksinimler**
- [Node.js](https://nodejs.org/en/) (v18+)
- [npm](https://www.npmjs.com/) / [yarn](https://yarnpkg.com/)

### **Kurulum Adımları**

**🚀 Adım 1: Bağımlılıkları Yükle (Install Dependencies)**

Projenin ihtiyaç duyduğu tüm `node` paketlerini ve bağımlılıkları sisteme yükleyin. Bu komut, `package.json` dosyasını okuyarak gerekli tüm modülleri `node_modules` klasörüne kuracaktır.

```bash
npm install```

**🔒 Adım 2: Çekirdek Doğrulama (Core Verification)**

Bu adım, projenin mimarisini anlamak için kritik öneme sahiptir. Sistemi tam potansiyeliyle kullanmak ve gerçek verileri işlemek için, bu arayüzle iletişim kuracak olan kendi `backend.py` dosyanızı oluşturup ana dizine yerleştirmeniz gerekmektedir.

> **Not:** Bu dosya olmadan, bir sonraki adımda çalıştıracağınız komut, sadece sahte verilerle çalışan (varsa) veya tamamen işlevsiz, boş bir arayüz (shell) başlatacaktır.

**⚡ Adım 3: Sistemi Ateşle (Ignite the System)**

Gerekli kurulumlar tamamlandıktan sonra, Vite geliştirme sunucusunu başlatarak arayüzü yerel makinenizde çalıştırın.

bash
npm run dev
Bu komut, genellikle http://localhost:5173 adresinde projenizi ayağa kaldıracaktır.
```
<div align="center">
🛡️ ARCHITECTED BY GHOST
<a href="https://byghost.tr" target="_blank" rel="noopener" style="text-decoration: none;">
<img src="https://img.shields.io/badge/Official_Site-byghost.tr-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="byghost.tr Official Website" />
</a>
<p style="color: #666; font-size: 12px; margin-top: 10px;">
SYSTEM ID: X-UNDEFINED | NO LOGS KEPT
</p>
</div>

