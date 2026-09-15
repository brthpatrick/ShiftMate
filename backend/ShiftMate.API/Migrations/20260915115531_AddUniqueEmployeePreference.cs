using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftMate.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueEmployeePreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeePreferences_EmployeeId",
                table: "EmployeePreferences");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePreferences_EmployeeId",
                table: "EmployeePreferences",
                column: "EmployeeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeePreferences_EmployeeId",
                table: "EmployeePreferences");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeePreferences_EmployeeId",
                table: "EmployeePreferences",
                column: "EmployeeId");
        }
    }
}
