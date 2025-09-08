import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const BaseEmailTemplate = ({ text }: { text: string }) => {
  return (
    <Html>
      <Head />
      <Preview>Sample</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Sample Email</Heading>
          <Section style={bodySection}>
            <Text style={paragraphStyle}>{text}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BaseEmailTemplate;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  color: '#333',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '32px 0',
  color: '#222',
};

const bodySection = {
  padding: '0 24px',
};

const paragraphStyle = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
  marginBottom: '16px',
};

const linkStyle = {
  color: '#007bff',
  textDecoration: 'underline',
};

const otpStyle = {
  display: 'block',
  width: 'fit-content',
  margin: '20px auto',
  padding: '12px 20px',
  backgroundColor: '#f0f4f8',
  borderRadius: '6px',
  color: '#007bff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  textAlign: 'center' as const,
};

const highlightStyle = {
  color: '#d9534f',
  fontWeight: 'bold',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '20px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  marginTop: '40px',
  padding: '0 16px',
};
