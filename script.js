$(document).ready(function() {
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    let assets = [];
    let currentStep = 1;
    let ProcessType = "";
    let ContentType = "";
    let Selectedcategories = [];
    let IsEmailVerified = false;
    let IsManual = false;
    let AIDescription = "";
    
    function initSortable() {
        $("#textAreas").sortable({
            handle: ".drag-handle",
            placeholder: "sortable-ghost",
            opacity: 0.7,
            update: function() {
                saveDraft();
            }
        }).disableSelection();
    }
    
    function addImageContainer(imageUrl, index) {
        const containerId = `imageContainer_${Date.now()}_${index}`;
        const container = $(`
            <div id="${containerId}" class="image-container ui-sortable-handle">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="drag-handle"><i class="bi bi-grip-vertical"></i> Image ${index + 1}</span>
                    <button type="button" class="btn btn-sm btn-danger remove-item"><i class="bi bi-trash"></i></button>
                </div>
                <input type="file" class="form-control image-input" accept="image/*">
                <div class="image-preview mt-2">
                    ${imageUrl ? `<img src="${imageUrl}" class="preview-image" style="display: block;">` : '<img src="" class="preview-image" style="display: none;">'}
                </div>
            </div>
        `);
        
        $("#textAreas").append(container);
        
        container.find('.image-input').change(function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    container.find('.preview-image').attr('src', e.target.result).show();
                    saveDraft();
                };
                reader.readAsDataURL(file);
            }
        });
        
        container.find('.remove-item').click(function() {
            container.remove();
            saveDraft();
        });
        
        saveDraft();
        return container;
    }
    
    function addTextArea(content, index, isFromDraft) {
        const containerId = `textArea_${Date.now()}_${index}`;
        const container = $(`
            <div id="${containerId}" class="text-editor-container ui-sortable-handle">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="drag-handle"><i class="bi bi-grip-vertical"></i> Paragraph ${index + 1}</span>
                    <button type="button" class="btn btn-sm btn-danger remove-item"><i class="bi bi-trash"></i></button>
                </div>
                <div class="text-editor" contenteditable="true">${content || '<p>Enter your content here...</p>'}</div>
            </div>
        `);
        
        $("#textAreas").append(container);
        
        if (!isFromDraft) {
            container.find('.text-editor').on('input', function() {
                saveDraft();
            });
        } else {
            container.find('.text-editor').html(content);
        }
        
        container.find('.remove-item').click(function() {
            container.remove();
            saveDraft();
        });
        
        saveDraft();
        return container;
    }
    
    function saveDraft() {
        const formData = {
            currentStep: currentStep,
            contentType: ContentType,
            processType: ProcessType,
            title: $('#Title').val(),
            publishDate: $('#PublishDate').val(),
            aiDescription: $('.SampleDescriptionforAI').val(),
            aiTitleWords: $('#ai-title-words').val(),
            aiDescWords: $('#ai-desc-words').val(),
            readingTime: $('#txtReadingTime').val(),
            categories: $('.ckcategory:checked').map(function() { return $(this).val(); }).get(),
            assets: []
        };
        
        $('#textAreas').children().each(function() {
            if ($(this).hasClass('image-container')) {
                const imgSrc = $(this).find('.preview-image').attr('src');
                if (imgSrc) {
                    formData.assets.push({
                        type: 'image',
                        content: imgSrc
                    });
                }
            } else if ($(this).hasClass('text-editor-container')) {
                formData.assets.push({
                    type: 'text',
                    content: $(this).find('.text-editor').html()
                });
            }
        });
        
        localStorage.setItem('contentDraft', JSON.stringify(formData));
    }
    
    function loadDraft() {
        const draft = localStorage.getItem('contentDraft');
        if (draft) {
            const formData = JSON.parse(draft);
            
            $('#draftNotification').show();
            
            currentStep = formData.currentStep || 1;
            ContentType = formData.contentType || '';
            ProcessType = formData.processType || '';
            
            $('#Title').val(formData.title || '');
            $('#PublishDate').val(formData.publishDate || '');
            $('.SampleDescriptionforAI').val(formData.aiDescription || '');
            $('#ai-title-words').val(formData.aiTitleWords || '');
            $('#ai-desc-words').val(formData.aiDescWords || '');
            $('#txtReadingTime').val(formData.readingTime || '');
            
            $('.ckcategory').prop('checked', false);
            if (formData.categories) {
                formData.categories.forEach(cat => {
                    $(`.ckcategory[value="${cat}"]`).prop('checked', true);
                });
            }
            
            $('#textAreas').empty();
            if (formData.assets && formData.assets.length > 0) {
                formData.assets.forEach((asset, index) => {
                    if (asset.type === 'image') {
                        addImageContainer(asset.content, index);
                    } else if (asset.type === 'text') {
                        addTextArea(asset.content, index, true);
                    }
                });
            } else {
                addImageContainer('', 0);
                addTextArea('', 0, false);
            }
            
            updateUIForStep(currentStep);
            updateProgressBar();
        } else {
            addImageContainer('', 0);
            addTextArea('', 0, false);
        }
    }
    
    function updateUIForStep(step) {
        $('.step').hide().removeClass('active');
        $('.step-' + step).show().addClass('active');
        
        if (step === 1) {
            $('.prev-step').hide();
        } else {
            $('.prev-step').show();
        }
        
        if (step === 6) {
            $('.next-step').hide();
            $('.submit').removeClass('d-none');
        } else {
            $('.next-step').show();
            $('.submit').addClass('d-none');
        }
        
        updateHeader(step);
    }
    
    function updateHeader(step) {
        const headers = {
            1: "Choose Content Type",
            2: "Select Your Preferred Method",
            3: "Define Your Content Details with AI",
            4: "Enter Title and Publish Date",
            5: "Add Description and Image",
            6: "Select Associated Categories"
        };
        $('.main-heading h2').text(headers[step] || '');
    }
    
    function updateProgressBar() {
        const progressPercentage = ((currentStep - 1) / 6) * 100;
        $('.progress-bar').css('width', progressPercentage + '%');
    }
    
    function showPreview() {
        $('#previewTitle').text($('#Title').val());
        $('#previewContent').empty();
        
        $('#textAreas').children().each(function() {
            if ($(this).hasClass('image-container')) {
                const imgSrc = $(this).find('.preview-image').attr('src');
                if (imgSrc) {
                    $('#previewContent').append(`
                        <div class="preview-item">
                            <img src="${imgSrc}" class="img-fluid">
                        </div>
                    `);
                }
            } else if ($(this).hasClass('text-editor-container')) {
                $('#previewContent').append(`
                    <div class="preview-item">
                        ${$(this).find('.text-editor').html()}
                    </div>
                `);
            }
        });
        
        previewModal.show();
    }
    
    function validateCurrentStep() {
        if (currentStep === 1 && !$('.ContentTypes').hasClass('selected')) {
            alert('Please select content type - Article / Blog / Story.');
            return false;
        }
        
        if (currentStep === 2 && !$('.PreferredContentMethod').hasClass('selected')) {
            alert('Please select an option to proceed: Manual Process or AI Process.');
            return false;
        }
        
        if (currentStep === 3 && ProcessType !== 'Manual') {
            const aiDesc = $('.SampleDescriptionforAI').val().trim();
            const titleWords = parseInt($('#ai-title-words').val());
            const descWords = parseInt($('#ai-desc-words').val());
            
            if (!aiDesc) {
                alert('Please enter some description to proceed with AI-generated content.');
                return false;
            }
            
            if (isNaN(titleWords) || titleWords < 10 || titleWords > 30) {
                alert('Please specify the title length (10-30 words) to proceed with AI generation.');
                return false;
            }
            
            if (isNaN(descWords) || descWords < 100 || descWords > 1000) {
                alert('Please specify the description length (100-1000 words) to proceed with AI generation.');
                return false;
            }
        }
        
        if (currentStep === 4) {
            const title = $('#Title').val().trim();
            const publishDate = $('#PublishDate').val();
            
            if (title.length < 50 || title.length > 180) {
                alert('Title must be between 50-180 characters.');
                return false;
            }
            
            if (!publishDate) {
                alert('Please select publish date.');
                return false;
            }
        }
        
        if (currentStep === 5) {
            if ($('#textAreas .text-editor-container').length === 0) {
                alert('Please add at least one text paragraph.');
                return false;
            }
            
            if ($('.image-container').length === 0) {
                alert('Please add at least one image.');
                return false;
            }
            
            let hasEmptyFields = false;
            $('#textAreas .text-editor-container').each(function() {
                if ($(this).find('.text-editor').text().trim().length < 30) {
                    hasEmptyFields = true;
                    return false;
                }
            });
            
            if (hasEmptyFields) {
                alert('All text paragraphs must have at least 30 characters.');
                return false;
            }
            
            let hasEmptyImages = false;
            $('.image-container').each(function() {
                if ($(this).find('.preview-image').attr('src') === '' || 
                    $(this).find('.preview-image').css('display') === 'none') {
                    hasEmptyImages = true;
                    return false;
                }
            });
            
            if (hasEmptyImages) {
                alert('Please upload all selected images.');
                return false;
            }
        }
        
        if (currentStep === 6 && $('.ckcategory:checked').length === 0) {
            alert('Please select at least one category.');
            return false;
        }
        
        return true;
    }
    
    $('#discardDraft').click(function() {
        if (confirm('Are you sure you want to discard your draft? This cannot be undone.')) {
            localStorage.removeItem('contentDraft');
            $('#draftNotification').hide();
            location.reload();
        }
    });
    
    $('#previewButton').click(function() {
        if (validateCurrentStep()) {
            showPreview();
        }
    });
    
    $('#confirmSubmit').click(function() {
        previewModal.hide();
        $('.submit').click();
    });
    
    $('.ContentTypes').click(function() {
        $('.ContentTypes').removeClass('selected');
        $(this).addClass('selected');
        ContentType = $(this).data('value');
        saveDraft();
    });
    
    $('.PreferredContentMethod').click(function() {
        $('.PreferredContentMethod').removeClass('selected');
        $(this).addClass('selected');
        ProcessType = $(this).data('value');
        IsManual = ProcessType === 'Manual';
        saveDraft();
    });
    
    $('.next-step').click(function() {
        if (validateCurrentStep()) {
            currentStep++;
            updateUIForStep(currentStep);
            saveDraft();
        }
    });
    
    $('.prev-step').click(function() {
        currentStep--;
        updateUIForStep(currentStep);
        saveDraft();
    });
    
    $('#addImageButton').click(function() {
        addImageContainer('', $('.image-container').length);
        initSortable();
    });
    
    $('#addTextAreaButton').click(function() {
        addTextArea('', $('.text-editor-container').length, false);
        initSortable();
    });
    
    $('input, textarea, [contenteditable]').on('input change', function() {
        saveDraft();
    });
    
    $('.ckcategory').change(function() {
        saveDraft();
    });
    
    loadDraft();
    initSortable();
});
