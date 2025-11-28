import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-faq.component.html',
  styleUrls: ['./support-faq.component.css'],
})
export class SupportFaqComponent {
  openAccordionId: number | null = null;

  supportLinks = [
    { label: 'Contact Sales', url: '#', icon: 'email' },
    { label: 'Documentation', url: '#', icon: 'article' }
  ];

  faqs = [
    {
      id: 1,
      question: 'How does ReputeAI monitor my brand reputation?',
      answer: 'ReputeAI uses advanced machine learning algorithms to scan millions of data points across social media, news outlets, forums, and review sites in real-time. We analyze sentiment, detect emerging trends, and flag potential risks instantly, giving you a comprehensive view of your digital footprint.'
    },
    {
      id: 2,
      question: 'Can I integrate ReputeAI with my existing tools?',
      answer: 'Yes! ReputeAI offers seamless integration with popular platforms like Slack, Microsoft Teams, Salesforce, and HubSpot. You can receive real-time alerts directly in your workflow and sync data with your CRM to ensure your team is always aligned.'
    },
    {
      id: 3,
      question: 'Is my data secure with ReputeAI?',
      answer: 'Security is our top priority. We use enterprise-grade encryption for all data in transit and at rest. Our platform is SOC 2 Type II compliant, ensuring that your sensitive brand information and customer data are protected by the highest industry standards.'
    },
    {
      id: 4,
      question: 'How does the sentiment analysis work?',
      answer: 'Our proprietary NLP (Natural Language Processing) models go beyond simple keyword matching. They understand context, sarcasm, and emotional nuance to accurately categorize mentions as positive, negative, or neutral, providing you with true insight into public perception.'
    },
    {
      id: 5,
      question: 'Can ReputeAI help with crisis management?',
      answer: 'Absolutely. Our "Crisis Prevention" module detects anomalies and spikes in negative sentiment before they go viral. We provide automated workflows and playbook recommendations to help your team respond typically within minutes, mitigating potential damage.'
    },
    {
      id: 6,
      question: 'Do you offer custom reporting?',
      answer: 'Yes, our Insights Studio allows you to build fully customizable dashboards and reports. You can track specific KPIs, compare against competitors, and schedule automated PDF exports for your executive team or stakeholders.'
    }
  ];

  toggleAccordion(id: number): void {
    if (this.openAccordionId === id) {
      this.openAccordionId = null;
    } else {
      this.openAccordionId = id;
    }
  }

  isOpen(id: number): boolean {
    return this.openAccordionId === id;
  }
}
