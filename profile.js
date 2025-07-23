const firebaseConfig = {
            apiKey: "AIzaSyBlRmmCKp8BYCfhXSVO8oapI0MtnTbf5kU",
            authDomain: "skill-craft-79597.firebaseapp.com",
            projectId: "skill-craft-79597",
            storageBucket: "skill-craft-79597.firebasestorage.app",
            messagingSenderId: "916636695046",
            appId: "1:916636695046:web:dd600d39c5ad1af81ea187",
            measurementId: "G-3MM50DH5SY"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

        // Initialize modal and form elements
        const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        const editProfileForm = document.querySelector('#editProfileModal form');
        const editFullNameInput = document.getElementById('editFullName');
        const editPhoneInput = document.getElementById('editPhone');
        const editPhotoInput = document.getElementById('editPhoto');
        const saveChangesBtn = document.getElementById('editProfileBtn');

        // Current user data
        let currentUser = null;
        let currentUserData = null;

        // Function to load user's courses
        async function loadUserCourses() {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const coursesTab = document.getElementById('coursesTab');
                    
                    // Clear existing course cards (except the header)
                    const courseContainer = coursesTab.querySelector('.row.g-4');
                    if (courseContainer) {
                        courseContainer.innerHTML = '';
                    }

                    // Check if user has any courses
                    if (userData.courses && userData.courses.length > 0) {
                        // Create course cards for each purchased course
                        userData.courses.forEach(courseId => {
                            const courseCard = createCourseCard(courseId, userData[`progress_${courseId}`] || 0);
                            if (courseCard && courseContainer) {
                                courseContainer.appendChild(courseCard);
                            }
                        });
                    } else {
                        // Show message if no courses purchased
                        const noCoursesMsg = document.createElement('div');
                        noCoursesMsg.className = 'col-12 text-center py-4';
                        noCoursesMsg.innerHTML = `
                            <div class="alert alert-info">
                                <i class="fas fa-book me-2"></i> You haven't purchased any courses yet.
                                <a href="index.html" class="alert-link">Browse courses</a>
                            </div>
                        `;
                        if (courseContainer) {
                            courseContainer.appendChild(noCoursesMsg);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading user courses:", error);
            }
        }

        // Helper function to create course cards
        function createCourseCard(courseId, progress = 0) {
            const courseData = {
                'course1': {
                    title: 'Web Development',
                    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    category: 'web-dev',
                    btnClass: 'btn-primary'
                },
                'course2': {
                    title: 'Cybersecurity',
                    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    category: 'cyber',
                    btnClass: 'btn-danger'
                },
                'course3': {
                    title: 'Financial Trading',
                    image: 'https://images.unsplash.com/photo-1468254095679-bbcba94a7066?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
                    category: 'finance',
                    btnClass: 'btn-info text-white'
                }
            };

            const course = courseData[courseId];
            if (!course) return null;

            // Determine status based on progress
            let status = 'Not Started';
            let statusClass = 'bg-secondary bg-opacity-10 text-secondary';
            
            if (progress > 0 && progress < 100) {
                status = 'In Progress';
                statusClass = 'bg-primary bg-opacity-10 text-primary';
            } else if (progress >= 100) {
                status = 'Completed';
                statusClass = 'bg-success bg-opacity-10 text-success';
            }

            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-6';
            colDiv.innerHTML = `
                <div class="course-card ${course.category} h-100">
                    <img src="${course.image}" class="course-img w-100" alt="${course.title}">
                    <div class="card-body p-4">
                        <h4 class="fw-bold mb-3">${course.title}</h4>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Progress</small>
                                <small>${progress}%</small>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge ${statusClass}">${status}</span>
                            <button class="btn btn-sm ${course.btnClass} view-course-btn">
                                ${progress > 0 ? 'Continue' : 'Start Now'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            return colDiv;
        }

        // Function to open edit profile modal with current data
        function openEditProfileModal() {
            if (!currentUser) return;
            
            // Fill form with current data
            editFullNameInput.value = currentUserData?.fullName || currentUser.displayName || '';
            editPhoneInput.value = currentUserData?.phone || '';
            
            // Show the modal
            editProfileModal.show();
        }

        // Handle profile update
        saveChangesBtn.addEventListener('click', async function() {
            if (!currentUser) return;
            
            const newFullName = editFullNameInput.value.trim();
            const newPhone = editPhoneInput.value.trim();
            const newPhotoFile = editPhotoInput.files[0];
            
            try {
                // Show loading state
                saveChangesBtn.disabled = true;
                saveChangesBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
                
                // Update data object
                const updates = {
                    fullName: newFullName,
                    phone: newPhone,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Handle photo upload if a new file was selected
                if (newPhotoFile) {
                    const storageRef = storage.ref(`profile_images/${currentUser.uid}`);
                    const uploadTask = storageRef.put(newPhotoFile);
                    
                    // Wait for upload to complete
                    const snapshot = await uploadTask;
                    const photoURL = await snapshot.ref.getDownloadURL();
                    
                    // Add photoURL to updates
                    updates.photoURL = photoURL;
                    
                    // Update auth profile photo
                    await currentUser.updateProfile({
                        photoURL: photoURL
                    });
                }
                
                // Update Firestore
                await db.collection('users').doc(currentUser.uid).set(updates, { merge: true });
                
                // Update UI
                updateProfileUI(currentUser, { ...currentUserData, ...updates });
                
                // Close modal
                editProfileModal.hide();
                
                // Show success message
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Error updating profile. Please try again.');
            } finally {
                // Reset button state
                saveChangesBtn.disabled = false;
                saveChangesBtn.textContent = 'Save Changes';
            }
        });
                // Tab switching functionality
        document.querySelectorAll('.profile-nav-item').forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                document.querySelectorAll('.profile-nav-item').forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
            this.classList.add('active');
                
                // Hide all tab contents
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                
                // Show the corresponding tab content
                const tabId = this.getAttribute('data-tab') + 'Tab';
                document.getElementById(tabId).style.display = 'block';
                document.getElementById(tabId).classList.add('active');
                
                // Load courses if courses tab is clicked
                if (tabId === 'coursesTab') {
                    loadUserCourses();
                }
            });
        });

      // Handle course card clicks
document.addEventListener('click', function(e) {
    // Check if a course card was clicked
    if (e.target.closest('.course-card') || e.target.closest('.view-course-btn')) {
        e.preventDefault();
        const courseCard = e.target.closest('.course-card');
        let courseId;
        
        // Determine which course was clicked
        if (courseCard.classList.contains('web-dev')) {
            courseId = 'web';
        } else if (courseCard.classList.contains('cyber')) {
            courseId = 'cyber';
        } else {
            courseId = 'finance'; // or any other default course
        }
        
        // Hide all tabs and show the selected course content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });
        
        const courseContent = document.getElementById(`${courseId}CourseContent`);
        if (courseContent) {
            courseContent.style.display = 'block';
            courseContent.classList.add('active');
            
            // Reset to first lesson when switching courses
            const firstLessonLink = courseContent.querySelector('.lesson-link');
            if (firstLessonLink) {
                firstLessonLink.click();
            }
        }
        
        // Update progress display
        updateCourseProgress(courseId);
    }
    
    // Back to courses button
    if (e.target.closest('.back-to-courses-btn')) {
        e.preventDefault();
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });
        document.getElementById('coursesTab').style.display = 'block';
        document.getElementById('coursesTab').classList.add('active');
        
        // Update navigation tab
        document.querySelectorAll('.profile-nav-item').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('.profile-nav-item[data-tab="courses"]').classList.add('active');
    }
    
    // Lesson navigation (works for both courses)
    if (e.target.closest('.lesson-link')) {
        e.preventDefault();
        const lessonLink = e.target.closest('.lesson-link');
        const lessonNumber = lessonLink.dataset.lesson;
        const courseContent = lessonLink.closest('.tab-content');
        
        // Update active lesson in sidebar
        courseContent.querySelectorAll('.lesson-link').forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        lessonLink.classList.add('active');
        lessonLink.setAttribute('aria-current', 'page');
        
        // Show corresponding lesson content
        courseContent.querySelectorAll('.lesson-section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        const activeLesson = courseContent.querySelector(`.lesson-section[data-lesson="${lessonNumber}"]`);
        if (activeLesson) {
            activeLesson.style.display = 'block';
            activeLesson.classList.add('active');
        }
        
        // Update navigation buttons
        updateLessonNavigation(lessonNumber, courseContent.id);
    }
    
    // Previous lesson button
    if (e.target.closest('.prev-lesson-btn') && !e.target.closest('.prev-lesson-btn').disabled) {
        e.preventDefault();
        const courseContent = e.target.closest('.tab-content');
        const currentLesson = courseContent.querySelector('.lesson-link.active').dataset.lesson;
        const prevLesson = courseContent.querySelector(`.lesson-link[data-lesson="${parseInt(currentLesson) - 1}"]`);
        if (prevLesson) {
            prevLesson.click();
        }
    }
    
    // Next lesson button
    if (e.target.closest('.next-lesson-btn') && !e.target.closest('.next-lesson-btn').disabled) {
        e.preventDefault();
        const courseContent = e.target.closest('.tab-content');
        const currentLesson = courseContent.querySelector('.lesson-link.active').dataset.lesson;
        const nextLesson = courseContent.querySelector(`.lesson-link[data-lesson="${parseInt(currentLesson) + 1}"]`);
        if (nextLesson) {
            nextLesson.click();
        }
    }
});

// Update lesson navigation buttons
function updateLessonNavigation(lessonNumber, courseId) {
    const courseContent = document.getElementById(courseId);
    if (!courseContent) return;
    
    const prevBtn = courseContent.querySelector('.prev-lesson-btn');
    const nextBtn = courseContent.querySelector('.next-lesson-btn');
    const totalLessons = courseContent.querySelectorAll('.lesson-link').length;
    
    // Update previous button
    if (parseInt(lessonNumber) === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
    
    // Update next button
    if (parseInt(lessonNumber) === totalLessons) {
        nextBtn.disabled = true;
        nextBtn.innerHTML = 'Complete Course <i class="fas fa-check ms-2"></i>';
    } else {
        nextBtn.disabled = false;
        nextBtn.innerHTML = 'Next Lesson <i class="fas fa-arrow-right ms-2"></i>';
    }
}

// Update course progress
function updateCourseProgress(courseId) {
    const courseContent = document.getElementById(`${courseId}CourseContent`);
    if (!courseContent) return;
    
    const completedLessons = courseContent.querySelectorAll('.lesson-link.active').length;
    const totalLessons = courseContent.querySelectorAll('.lesson-link').length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    
    const progressBar = courseContent.querySelector('.progress-bar');
    const progressText = courseContent.querySelector('.progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);
    }
    
    if (progressText) {
        progressText.textContent = `${progressPercentage}% Complete`;
    }
                }

        // Your original function (unchanged)

        // Your original navigation function (unchanged)
function updateLessonNavigation(currentLesson) {
    const current = parseInt(currentLesson);
    const prevBtn = document.querySelector('.prev-lesson-btn');
    const nextBtn = document.querySelector('.next-lesson-btn');
    
    // Update previous button
    if (current === 1) {
        prevBtn.disabled = true;
    } else {
        prevBtn.disabled = false;
    }
    
    // Update next button
    if (current === 10) {
        nextBtn.textContent = 'Complete Course';
    } else {
        nextBtn.textContent = 'Next Lesson';
    }
}

// Enhanced video control script

document.addEventListener('DOMContentLoaded', function() {
    // Function to stop all YouTube videos
    function stopAllVideos() {
        document.querySelectorAll('.lesson-section iframe').forEach(iframe => {
            if (iframe.src.includes('youtube.com')) {
                const videoSrc = iframe.src;
                iframe.src = '';
                setTimeout(() => { iframe.src = videoSrc; }, 100);
            }
        });
    }
    
    // Setup for next/prev buttons
    document.querySelector('.next-lesson-btn')?.addEventListener('click', stopAllVideos);
    document.querySelector('.prev-lesson-btn')?.addEventListener('click', stopAllVideos);
    
    // Setup for lesson links
    document.querySelectorAll('.lesson-link').forEach(link => {
        link.addEventListener('click', stopAllVideos);
    });
    
    // Optional: If you dynamically load content later, you may need to reattach these handlers
    window.reinitializeVideoControls = function() {
        document.querySelectorAll('.lesson-link').forEach(link => {
            link.removeEventListener('click', stopAllVideos);
            link.addEventListener('click', stopAllVideos);
        });
    };
});

        

        function markLessonComplete(lessonNumber) {
            // Implement logic to mark lesson as complete and update progress
            // This would update Firestore with the user's progress
            console.log(`Marking lesson ${lessonNumber} as complete`);
        }

        // Logout functionality
        document.getElementById('logoutBtn').addEventListener('click', function() {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                alert('Error during logout. Please try again.');
            });
        });

        // Password reset functionality
        document.getElementById('changePasswordBtn').addEventListener('click', function() {
            const user = auth.currentUser;
            if (!user || !user.email) {
                alert('User not authenticated. Please log in again.');
                return;
            }
            
            auth.sendPasswordResetEmail(user.email).then(() => {
                alert('Password reset email sent. Please check your inbox.');
            }).catch((error) => {
                console.error('Password reset error:', error);
                alert('Error sending password reset email. Please try again.');
            });
        });

        // Update UI with user data
        function updateProfileUI(user, userData) {
            // Basic profile info
            document.getElementById('profileName').textContent = 
                userData?.fullName || user.displayName || 'User';
            
            document.getElementById('profileEmail').textContent = 
                user.email || 'No email';
            
            document.getElementById('profileFullName').textContent = 
                userData?.fullName || user.displayName || 'Not provided';
            
            document.getElementById('profileEmailDetail').textContent = 
                user.email || 'Not provided';
            
            // Profile image (uses auth photoURL if available)
            if (user.photoURL) {
                document.getElementById('profileImage').src = user.photoURL;
            } else if (userData?.photoURL) {
                document.getElementById('profileImage').src = userData.photoURL;
            }
            
            // Account creation date
            if (userData?.createdAt) {
                const joinDate = userData.createdAt.toDate();
                document.getElementById('profileJoinDate').textContent = 
                    joinDate.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                    });
            } else if (user.metadata.creationTime) {
                const joinDate = new Date(user.metadata.creationTime);
                document.getElementById('profileJoinDate').textContent = 
                    joinDate.toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                    });
            } else {
                document.getElementById('profileJoinDate').textContent = 'Unknown';
            }
            
            // Phone number (if available in Firestore)
            if (userData?.phone) {
                // Create phone element if doesn't exist
                if (!document.getElementById('profilePhone')) {
                    const phoneContainer = document.createElement('div');
                    phoneContainer.className = 'profile-detail';
                    phoneContainer.innerHTML = `
                        <div class="profile-detail-label">Phone</div>
                        <div class="profile-detail-value" id="profilePhone"></div>
                    `;
                    document.querySelector('.profile-card .row').appendChild(phoneContainer);
                }
                document.getElementById('profilePhone').textContent = userData.phone;
            }
        }

        // Load user data when authentication state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                
                // Update user ID
                document.getElementById('profileUserId').textContent = user.uid.substring(0, 8) + '...';
                
                // Update last login time
                if (user.metadata.lastSignInTime) {
                    const lastLogin = new Date(user.metadata.lastSignInTime);
                    document.getElementById('lastLogin').textContent = 
                        lastLogin.toLocaleString('en-US', {
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                }
                
                // Fetch additional user data from Firestore
                db.collection('users').doc(user.uid).get().then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        currentUserData = userData;
                        updateProfileUI(user, userData);
                    } else {
                        console.log("No user data found in Firestore");
                        currentUserData = null;
                        updateProfileUI(user, null);
                    }
                }).catch((error) => {
                    console.error("Error getting user document:", error);
                    currentUserData = null;
                    updateProfileUI(user, null);
                });
            } else {
                currentUser = null;
                currentUserData = null;
                window.location.href = 'login.html';
            }
        });
