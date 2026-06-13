from django.db import models


class ClassMaster(models.Model):
    # id auto-increment by default
    class_name = models.CharField(max_length=50, verbose_name='Class')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_master'
        ordering = ['class_name']

    def __str__(self):
        return f'{self.class_name} ({self.session})'


class ClassSectionMaster(models.Model):
    # id auto-increment by default
    class_master = models.ForeignKey(ClassMaster, on_delete=models.CASCADE, related_name='sections')
    section_name = models.CharField(max_length=10, verbose_name='Section')
    status = models.BooleanField(default=True, help_text='1=Active, 0=Inactive')
    session = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'class_section_master'
        ordering = ['class_master', 'section_name']

    def __str__(self):
        return f'{self.class_master.class_name} - {self.section_name}'
