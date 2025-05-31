import axios from 'axios';

// Configuration - Update these values for your setup
const API_BASE_URL = 'http://localhost:3000'; // Update with your NestJS server URL

interface ApiResponse<T = any> {
  data: T;
  status: number;
}

async function setupUserAndCompany() {
  try {
    console.log('🚀 Setting up user and company via API...');

    // Step 1: Register the first user (this will be the admin/owner)
    console.log('\n1. Creating admin user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'admiwn@demos.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
    });

    console.log('✅ Admin user created:', registerResponse.data);

    // Step 2: Login to get authentication token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admiwn@demos.com',
      password: 'password123',
    });

    const { access_token, user } = loginResponse.data;
    console.log('✅ Login successful');

    // Set authorization header for subsequent requests
    const authHeaders = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };

    console.log(authHeaders);

    // Step 3: Create a company
    console.log('\n3. Creating company...');
    const companyResponse = await axios.post(
      `${API_BASE_URL}/companies`,
      {
        name: 'Demo Company',
        description: 'A demo company for localization testing',
        projects: [],
      },
      {
        headers: authHeaders,
      },
    );

    console.log('✅ Company created:', companyResponse.data);
    const company = companyResponse.data;

    // Step 4: Update user's company
    console.log('\n4. Assigning user to company...');
    await axios.patch(
      `${API_BASE_URL}/user/${user.id}/company/${company.id}`,
      {},
      {
        headers: authHeaders,
      },
    );

    console.log('✅ User assigned to company');

    // Step 5: Create additional users
    console.log('\n5. Creating additional users...');

    // Create manager user
    const managerResponse = await axios.post(
      `${API_BASE_URL}/user`,
      {
        email: 'manager@demo.com',
        password: 'password123',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager',
        company: company.id,
      },
      {
        headers: authHeaders,
      },
    );

    console.log('✅ Manager user created');

    // Create translator user
    const translatorResponse = await axios.post(
      `${API_BASE_URL}/user`,
      {
        email: 'translator@demo.com',
        password: 'password123',
        firstName: 'Translator',
        lastName: 'User',
        role: 'translator',
        company: company.id,
      },
      {
        headers: authHeaders,
      },
    );

    console.log('✅ Translator user created');

    // Step 6: Create a sample project
    console.log('\n6. Creating sample project...');
    const projectResponse = await axios.post(
      `${API_BASE_URL}/projects`,
      {
        name: 'Demo Website',
        description: 'A demo website project for localization',
        company: company.id,
        projectType: 'website',
        websiteUrl: 'https://demo.example.com',
        supportedLocales: ['en-US', 'fr-CA', 'es-ES'],
        members: [managerResponse.data.id],
        settings: {
          translationQA: true,
          monthlyReport: true,
          autoDetectLanguage: true,
          archiveUnusedPhrases: false,
          translateMetaTags: true,
          translateAriaLabels: true,
          translatePageTitles: true,
          customizeImages: false,
          customizeUrls: false,
          customizeAudio: false,
          dateHandling: true,
          ignoreCurrency: false,
        },
      },
      {
        headers: authHeaders,
      },
    );

    console.log('✅ Sample project created:', projectResponse.data);

    // Step 7: Create sample locales
    console.log('\n7. Creating sample locales...');

    const locales = [
      {
        code: 'en-US',
        language: 'English (US)',
        isActive: true,
        projects: [projectResponse.data.id],
      },
      {
        code: 'fr-CA',
        language: 'French (Canada)',
        isActive: true,
        projects: [projectResponse.data.id],
      },
      {
        code: 'es-ES',
        language: 'Spanish (Spain)',
        isActive: true,
        projects: [projectResponse.data.id],
      },
    ];

    for (const locale of locales) {
      const localeResponse = await axios.post(
        `${API_BASE_URL}/locales`,
        locale,
        {
          headers: authHeaders,
        },
      );
      console.log(`✅ Locale created: ${locale.code}`);
    }

    // Step 8: Create sample phrases
    console.log('\n8. Creating sample phrases...');

    const samplePhrases = [
      {
        key: 'welcome_message',
        sourceText: 'Welcome to our localization platform!',
        context: 'Homepage welcome message',
        project: projectResponse.data.id,
        tags: ['homepage', 'welcome'],
      },
      {
        key: 'login_button',
        sourceText: 'Log In',
        context: 'Login button text',
        project: projectResponse.data.id,
        tags: ['auth', 'button'],
      },
      {
        key: 'error_message_404',
        sourceText: 'Page not found',
        context: '404 error message',
        project: projectResponse.data.id,
        tags: ['error', '404'],
      },
    ];

    for (const phrase of samplePhrases) {
      const phraseResponse = await axios.post(
        `${API_BASE_URL}/phrases`,
        phrase,
        {
          headers: authHeaders,
        },
      );
      console.log(`✅ Phrase created: ${phrase.key}`);
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n=== Account Details ===');
    console.log('Admin Account:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: password123');
    console.log('  Role: member (can be updated to owner in database)');
    console.log('');
    console.log('Manager Account:');
    console.log('  Email: manager@demo.com');
    console.log('  Password: password123');
    console.log('  Role: manager');
    console.log('');
    console.log('Translator Account:');
    console.log('  Email: translator@demo.com');
    console.log('  Password: password123');
    console.log('  Role: translator');
    console.log('');
    console.log('Company: Demo Company');
    console.log('Project: Demo Website');
    console.log('Locales: en-US, fr-CA, es-ES');
    console.log('Sample Phrases: 3 created');
    console.log('======================');

    return {
      user,
      company,
      project: projectResponse.data,
      token: access_token,
    };
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    throw error;
  }
}

// Alternative: Quick setup function for testing
async function quickSetup() {
  try {
    console.log('⚡ Quick setup (minimal data)...');

    // Register user
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'test@demo.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
    });

    console.log('✅ User created and can login with:');
    console.log('Email: test@demo.com');
    console.log('Password: test123');

    return registerResponse.data;
  } catch (error) {
    console.error(
      '❌ Quick setup failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
}

// Main execution
async function main() {
  const setupType = process.argv[2] || 'full';

  try {
    if (setupType === 'quick') {
      await quickSetup();
    } else {
      await setupUserAndCompany();
    }
  } catch (error: any) {
    console.error(
      'Setup failed. Make sure your NestJS server is running on',
      API_BASE_URL,
    );
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { setupUserAndCompany, quickSetup };
