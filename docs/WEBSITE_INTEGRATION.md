# Website Integration Guide

## Overview
This guide explains how to integrate the Spraystone Facade Simulator into your existing website.

## Integration Methods

### Method 1: New Page Route (Recommended)

If your website uses React or a modern framework, integrate as a new route.

#### For React Router
```javascript
// App.jsx or routes.jsx
import FacadeSimulator from './FacadeSimulator';

<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/simulator" element={<FacadeSimulator />} />
  <Route path="/about" element={<AboutPage />} />
</Routes>
```

#### Update Navigation
```html
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/simulator">Facade Simulator</a>
  <a href="/contact">Contact</a>
</nav>
```

### Method 2: Iframe Embed

Deploy simulator separately and embed via iframe.

```html
<!-- Add to any page -->
<div class="simulator-container">
  <iframe 
    src="https://simulator.spraystone.be" 
    width="100%" 
    height="800px"
    style="border: none; border-radius: 12px;"
    title="Facade Simulator"
  ></iframe>
</div>

<style>
  .simulator-container {
    max-width: 1400px;
    margin: 40px auto;
    padding: 0 20px;
  }
</style>
```

#### Responsive Iframe
```html
<div style="position: relative; padding-bottom: 75%; height: 0;">
  <iframe 
    src="https://simulator.spraystone.be" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="Facade Simulator"
  ></iframe>
</div>
```

### Method 3: Subdomain

Deploy to subdomain: `simulator.spraystone.be`

#### DNS Configuration
```
Type: CNAME
Name: simulator
Value: [your-deployment-url]
```

#### Benefits
- Isolated application
- Easy updates
- Independent scaling
- Clear URL structure

### Method 4: Modal/Overlay

Open simulator in a modal overlay from existing page.

```html
<button onclick="openSimulator()">
  Start Facade Simulator
</button>

<div id="simulator-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <span class="close" onclick="closeSimulator()">&times;</span>
    <iframe 
      id="simulator-iframe"
      src="https://simulator.spraystone.be" 
      width="100%" 
      height="90vh"
    ></iframe>
  </div>
</div>

<style>
.modal {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8);
}

.modal-content {
  position: relative;
  margin: 2% auto;
  padding: 20px;
  width: 95%;
  max-width: 1400px;
  background: white;
  border-radius: 12px;
}

.close {
  position: absolute;
  right: 20px;
  top: 10px;
  font-size: 35px;
  cursor: pointer;
}
</style>

<script>
function openSimulator() {
  document.getElementById('simulator-modal').style.display = 'block';
}

function closeSimulator() {
  document.getElementById('simulator-modal').style.display = 'none';
}
</script>
```

## WordPress Integration

### Option A: Custom Page Template

1. Create new page template: `page-simulator.php`

```php
<?php
/*
Template Name: Facade Simulator
*/
get_header();
?>

<div class="simulator-wrapper">
  <iframe 
    src="https://simulator.spraystone.be" 
    width="100%" 
    height="1000px"
    style="border: none;"
    title="Facade Simulator"
  ></iframe>
</div>

<?php get_footer(); ?>
```

2. Create new page in WordPress
3. Select "Facade Simulator" template
4. Publish

### Option B: Shortcode

Add to `functions.php`:

```php
function spraystone_simulator_shortcode() {
    return '<iframe 
        src="https://simulator.spraystone.be" 
        width="100%" 
        height="800px"
        style="border: none; border-radius: 12px;"
        title="Facade Simulator"
    ></iframe>';
}
add_shortcode('facade_simulator', 'spraystone_simulator_shortcode');
```

Use in any page/post:
```
[facade_simulator]
```

## Shopify Integration

### Custom Page

1. Create new page: `simulator`
2. Add HTML content:

```html
<div id="spraystone-simulator">
  <iframe 
    src="https://simulator.spraystone.be" 
    width="100%" 
    height="900px"
    style="border: none;"
  ></iframe>
</div>

<style>
#spraystone-simulator {
  margin: 40px 0;
}
</style>
```

3. Add to navigation menu

## Lead Capture Integration

### Option 1: Webhook to CRM

Configure webhook in simulator settings:

```javascript
// Add to App.jsx handleSubmit
const sendToCRM = async (formData) => {
  await fetch('https://your-crm.com/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      source: 'facade_simulator'
    })
  });
};
```

### Option 2: Zapier Integration

1. Create Zapier webhook
2. Add webhook URL to simulator
3. Connect to your CRM (HubSpot, Salesforce, etc.)

### Option 3: Email Notification

```javascript
// Send to your email via EmailJS
import emailjs from 'emailjs-com';

emailjs.send(
  'your_service_id',
  'your_template_id',
  {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address
  },
  'your_user_id'
);
```

## Styling Consistency

### Match Existing Website Colors

Update Tailwind config to match your brand:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-primary-color',
        secondary: '#your-secondary-color',
        accent: '#your-accent-color'
      }
    }
  }
}
```

### Hide Simulator Header/Footer

For iframe embed, add CSS:

```css
/* In the embedded app */
@media (max-width: 768px) {
  header, footer {
    display: none !important;
  }
}
```

## Analytics Tracking

### Track Simulator Usage

```javascript
// Add to simulator App.jsx
useEffect(() => {
  // Track page view
  gtag('event', 'page_view', {
    page_title: 'Facade Simulator',
    page_location: window.location.href
  });
}, []);

// Track step completion
const trackStep = (step) => {
  gtag('event', 'simulator_step', {
    event_category: 'Engagement',
    event_label: `Step ${step}`,
    value: step
  });
};

// Track completion
const trackCompletion = () => {
  gtag('event', 'simulator_complete', {
    event_category: 'Conversion',
    event_label: 'Facade Quote Generated'
  });
};
```

## Call-to-Action Buttons

### Homepage CTA

```html
<section class="simulator-cta">
  <h2>Transform Your Facade</h2>
  <p>See what your building could look like with Spraystone</p>
  <a href="/simulator" class="btn btn-primary">
    Start Free Simulator
  </a>
</section>

<style>
.simulator-cta {
  background: linear-gradient(135deg, #228B22, #32CD32);
  color: white;
  padding: 60px 20px;
  text-align: center;
  border-radius: 12px;
  margin: 40px 0;
}

.simulator-cta h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.simulator-cta .btn-primary {
  background: white;
  color: #228B22;
  padding: 15px 40px;
  border-radius: 30px;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  margin-top: 20px;
}
</style>
```

## SEO Optimization

### Meta Tags for Simulator Page

```html
<head>
  <title>Facade Simulator | Spraystone | Free Online Quote</title>
  <meta name="description" content="Transform your facade with our free AI-powered simulator. Get instant pricing and visualization for your Spraystone project.">
  <meta name="keywords" content="facade simulator, facade coating, spraystone, building renovation, facade quote">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Facade Simulator | Spraystone">
  <meta property="og:description" content="See your facade transformation before you commit. Free instant quote.">
  <meta property="og:image" content="https://spraystone.be/simulator-preview.jpg">
  
  <!-- Schema Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Spraystone Facade Simulator",
    "description": "AI-powered facade transformation simulator",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  }
  </script>
</head>
```

## Mobile Optimization

### Ensure Touch-Friendly
```css
/* Add to your CSS */
button, a, input {
  min-height: 44px; /* iOS touch target minimum */
  min-width: 44px;
}

/* Improve tap highlight */
* {
  -webkit-tap-highlight-color: rgba(34, 139, 34, 0.3);
}
```

## Testing Checklist

- [ ] Test on actual website pages
- [ ] Verify navigation works
- [ ] Check styling matches website
- [ ] Test lead capture flow
- [ ] Verify CRM integration
- [ ] Test on mobile devices
- [ ] Check loading speed
- [ ] Verify analytics tracking
- [ ] Test all browsers
- [ ] Check SSL certificate

## Maintenance

### Regular Updates
- Review lead submissions weekly
- Check API usage/costs monthly
- Update content as needed
- Monitor performance metrics
- Test functionality quarterly

### Backup Strategy
- Keep source code in Git
- Export lead data regularly
- Document any customizations
- Maintain environment variables list

## Support Resources

- **Technical Issues**: Check browser console
- **API Errors**: Verify keys and quotas
- **Styling Issues**: Use browser DevTools
- **Integration Help**: Contact development team
