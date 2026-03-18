#!/usr/bin/env python3
"""
StageConnect Backend API Testing
Tests all critical API endpoints with demo data
"""

import requests
import sys
import json
from datetime import datetime

class StageConnectAPITester:
    def __init__(self, base_url="https://talent-hub-437.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.candidate_token = None
        self.recruiter_token = None
        self.tests_run = 0
        self.tests_passed = 0
        print(f"🚀 Testing StageConnect API at: {base_url}")

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding demo data"""
        print("\n" + "="*50)
        print("TESTING DATA SEEDING")
        print("="*50)
        
        success, response = self.run_test(
            "Seed Demo Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_authentication(self):
        """Test login endpoints for both roles"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test candidate login
        success, response = self.run_test(
            "Candidate Login",
            "POST", 
            "auth/login",
            200,
            data={"email": "marie@demo.com", "password": "demo123"}
        )
        if success and 'token' in response:
            self.candidate_token = response['token']
            print(f"   Candidate token received: {self.candidate_token[:20]}...")
        
        # Test recruiter login
        success, response = self.run_test(
            "Recruiter Login",
            "POST",
            "auth/login", 
            200,
            data={"email": "recruteur@techcorp.com", "password": "demo123"}
        )
        if success and 'token' in response:
            self.recruiter_token = response['token']
            print(f"   Recruiter token received: {self.recruiter_token[:20]}...")

        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )

        return bool(self.candidate_token and self.recruiter_token)

    def test_user_profile(self):
        """Test profile endpoints"""
        print("\n" + "="*50)
        print("TESTING USER PROFILES")
        print("="*50)
        
        if not self.candidate_token:
            print("❌ Skipping profile tests - no candidate token")
            return False
            
        # Test get current user profile
        self.run_test(
            "Get Current User Profile",
            "GET",
            "auth/me",
            200,
            token=self.candidate_token
        )
        
        # Test profile update
        self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data={"bio": "Updated bio via API test"},
            token=self.candidate_token
        )
        
        return True

    def test_offers_api(self):
        """Test offers endpoints"""
        print("\n" + "="*50)
        print("TESTING OFFERS API")
        print("="*50)
        
        # Test get all offers (public)
        success, offers = self.run_test(
            "Get All Offers",
            "GET",
            "offers",
            200
        )
        
        if success and offers:
            print(f"   Found {len(offers)} offers")
            
            # Test get specific offer
            if len(offers) > 0:
                offer_id = offers[0]['id']
                self.run_test(
                    "Get Specific Offer",
                    "GET",
                    f"offers/{offer_id}",
                    200
                )
        
        # Test filtered offers
        self.run_test(
            "Get Filtered Offers (Technology)",
            "GET",
            "offers?domain=Technologie",
            200
        )
        
        # Test recruiter's offers (requires auth)
        if self.recruiter_token:
            self.run_test(
                "Get My Offers (Recruiter)",
                "GET",
                "offers/mine",
                200,
                token=self.recruiter_token
            )
            
            # Test creating new offer
            self.run_test(
                "Create New Offer",
                "POST",
                "offers",
                200,
                data={
                    "title": "Test API Offer",
                    "type": "stage",
                    "description": "Test offer created via API",
                    "requirements": ["Python", "Testing"],
                    "location": "Paris",
                    "duration": "3 mois",
                    "domain": "Technologie",
                    "contract_type": "Stage"
                },
                token=self.recruiter_token
            )
        
        return True

    def test_applications_api(self):
        """Test applications endpoints"""
        print("\n" + "="*50)
        print("TESTING APPLICATIONS API")
        print("="*50)
        
        if not self.candidate_token:
            print("❌ Skipping applications tests - no candidate token")
            return False
            
        # Test get candidate's applications
        success, applications = self.run_test(
            "Get My Applications (Candidate)",
            "GET",
            "applications", 
            200,
            token=self.candidate_token
        )
        
        if success:
            print(f"   Found {len(applications)} applications")
            
        # Test get applications as recruiter
        if self.recruiter_token:
            self.run_test(
                "Get Applications (Recruiter)",
                "GET",
                "applications",
                200,
                token=self.recruiter_token
            )
        
        return True

    def test_stats_api(self):
        """Test stats endpoints"""
        print("\n" + "="*50)
        print("TESTING STATS API")
        print("="*50)
        
        # Test candidate stats
        if self.candidate_token:
            success, stats = self.run_test(
                "Get Candidate Stats",
                "GET",
                "stats",
                200,
                token=self.candidate_token
            )
            if success and stats:
                print(f"   Candidate stats: {stats}")
                
        # Test recruiter stats  
        if self.recruiter_token:
            success, stats = self.run_test(
                "Get Recruiter Stats", 
                "GET",
                "stats",
                200,
                token=self.recruiter_token
            )
            if success and stats:
                print(f"   Recruiter stats: {stats}")
                
        return True

    def test_recommendations(self):
        """Test recommendations endpoint"""
        print("\n" + "="*50)
        print("TESTING RECOMMENDATIONS")
        print("="*50)
        
        if not self.candidate_token:
            print("❌ Skipping recommendations test - no candidate token")
            return False
            
        success, recommendations = self.run_test(
            "Get Recommendations",
            "GET",
            "recommendations",
            200,
            token=self.candidate_token
        )
        
        if success and recommendations:
            print(f"   Found {len(recommendations)} recommendations")
            
        return True

    def test_conversations_and_messages(self):
        """Test messaging endpoints"""
        print("\n" + "="*50)
        print("TESTING CONVERSATIONS & MESSAGES")
        print("="*50)
        
        if not self.candidate_token:
            print("❌ Skipping messaging tests - no candidate token")
            return False
            
        # Test get conversations
        self.run_test(
            "Get Conversations",
            "GET", 
            "conversations",
            200,
            token=self.candidate_token
        )
        
        return True

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🧪 Starting StageConnect API Tests")
        print("=" * 60)
        
        # Seed data first
        if not self.test_seed_data():
            print("❌ Failed to seed data - stopping tests")
            return False
            
        # Test authentication (required for other tests)
        if not self.test_authentication():
            print("❌ Authentication failed - limited testing")
            
        # Run all tests
        self.test_user_profile()
        self.test_offers_api()
        self.test_applications_api()
        self.test_stats_api()
        self.test_recommendations()
        self.test_conversations_and_messages()
        
        # Print summary
        print("\n" + "="*60)
        print("🏁 TEST SUMMARY")
        print("="*60)
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test runner"""
    tester = StageConnectAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())