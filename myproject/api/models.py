from django.db import models

# Create your models here.
class Country(models.Model):
    name = models.CharField(max_length=255, unique=True)
    lat = models.FloatField()
    long = models.FloatField()

    def __str__(self):
        return self.name

class PopulationData(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="population_data")
    population = models.FloatField()
    year = models.IntegerField()
    radius = models.FloatField()

    def __str__(self):
        return f"{self.country.name} - {self.year}"