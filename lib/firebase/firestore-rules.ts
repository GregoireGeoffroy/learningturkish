rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in ['test1@test.com']; // Replace with your email
    }
    
    // Lessons collection rules
    match /lessons/{lessonId} {
      // Anyone can read lessons
      allow read: if true;
      
      // Only admins can create, update, or delete lessons
      allow create, update, delete: if isAdmin();
    }

    // Allow users to read and write their own vocabulary progress
    match /vocabularyProgress/{progressId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId ||
         isAdmin());
    }
    
    // Allow users to read and write their own lesson progress
    match /lessonProgress/{progressId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId ||
         isAdmin());
    }
    
    // Allow users to read and write their own user progress
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }
  }
} 